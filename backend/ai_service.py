import os
import json
import logging
from typing import List, Dict, Optional, Any
from openai import OpenAI
from models import (
    Flashcard,
    QuizQuestion,
    StructuredCourse,
    ProcessedChapter
)
import asyncio
from concurrent.futures import ThreadPoolExecutor
import httpx
from pydub import AudioSegment
import tempfile

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        # Make OpenAI optional so STT-only setups can run without it
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.executor = ThreadPoolExecutor(max_workers=4)
        # ElevenLabs config (lazy check in method to avoid startup failures)
        self.eleven_api_key: Optional[str] = os.getenv("ELEVENLABS_API_KEY")
        self.eleven_model_id: str = os.getenv("ELEVENLABS_STT_MODEL_ID", "scribe_v1")
    
    async def transcribe_audio(self, audio_path: str) -> str:
        """Transcribe audio file using ElevenLabs Speech-to-Text (language auto-detect)."""
        try:
            if not self.eleven_api_key:
                raise ValueError("ELEVENLABS_API_KEY not found in environment variables")

            logger.info(f"Transcribing audio file with ElevenLabs: {audio_path}")

            # Log file details
            file_size = os.path.getsize(audio_path)
            logger.info(f"Audio file size: {file_size} bytes")

            # Note: Files are now recorded as WAV directly, no conversion needed
            file_ext = os.path.splitext(audio_path)[1].lower()
            logger.info(f"Processing {file_ext.upper()} audio file - no conversion needed")

            def _transcribe() -> str:
                url = "https://api.elevenlabs.io/v1/speech-to-text"
                headers = {
                    "xi-api-key": self.eleven_api_key,
                }
                # Determine content type based on file extension
                filename = os.path.basename(audio_path)
                file_ext = os.path.splitext(filename)[1].lower()

                # Map file extensions to proper MIME types
                content_type_map = {
                    '.mp3': 'audio/mpeg',
                    '.wav': 'audio/wav',
                    '.flac': 'audio/flac',
                    '.m4a': 'audio/m4a',
                    '.aac': 'audio/aac',
                    '.ogg': 'audio/ogg',
                    '.webm': 'audio/webm'
                }

                content_type = content_type_map.get(file_ext, 'audio/wav')

                # Omit language_code to keep it null (auto-detect)
                # Note: model_id might not be required for current ElevenLabs API
                data = {}
                # Only include model_id if it's specified and not empty
                if self.eleven_model_id and self.eleven_model_id.strip():
                    data["model_id"] = self.eleven_model_id

                with open(audio_path, "rb") as f:
                    file_content = f.read()
                    logger.info(f"Read {len(file_content)} bytes from file")
                    files = {"file": (filename, file_content, content_type)}
                    logger.info(f"Sending request to ElevenLabs with content_type: {content_type}")
                    logger.info(f"Request data: {data}")

                    response = httpx.post(
                        url,
                        headers=headers,
                        data=data,
                        files=files,
                        timeout=120
                    )

                logger.info(f"ElevenLabs response status: {response.status_code}")
                logger.info(f"ElevenLabs response headers: {dict(response.headers)}")

                if response.status_code != 200:
                    logger.error(f"ElevenLabs error response: {response.text}")
                    logger.error(f"ElevenLabs error status: {response.status_code}")
                    # Try to get more detailed error info
                    try:
                        error_data = response.json()
                        logger.error(f"ElevenLabs error details: {error_data}")
                    except:
                        logger.error("Could not parse ElevenLabs error response as JSON")

                response.raise_for_status()
                payload = response.json()
                # Prefer text field; fallback to joining words if needed
                text = payload.get("text")
                if text is None and isinstance(payload.get("words"), list):
                    text = " ".join([w.get("text", "") for w in payload["words"]]).strip()
                if not text:
                    # As a last resort, return the JSON as string
                    text = json.dumps(payload)
                return text

            loop = asyncio.get_event_loop()
            result_text = await loop.run_in_executor(self.executor, _transcribe)

            logger.info("Transcription completed successfully (ElevenLabs)")
            return result_text

        except Exception as e:
            logger.error(f"Transcription error (ElevenLabs): {str(e)}")
            raise
    
    async def process_chapter(
        self,
        text: str,
        chapter_name: str,
        lesson_name: str,
        subject_name: str
    ) -> ProcessedChapter:
        """Process lesson text to generate all components in parallel"""
        try:
            logger.info("=== STARTING PARALLEL PROCESSING ===")
            logger.info(f"Processing lesson: {lesson_name}, subject: {subject_name}")
            logger.info(f"Text length: {len(text)} characters")

            # Run all AI generations in parallel
            logger.info("Creating parallel tasks for: course, flashcards, quiz")
            start_time = asyncio.get_event_loop().time()

            tasks = [
                self.generate_structured_course(text, chapter_name, lesson_name, subject_name),
                self.generate_flashcards(text),
                self.generate_quiz(text)
            ]

            logger.info("Starting parallel execution with asyncio.gather...")
            results = await asyncio.gather(*tasks)

            end_time = asyncio.get_event_loop().time()
            total_time = end_time - start_time
            logger.info(f"=== PARALLEL PROCESSING COMPLETED ===")
            logger.info(f"Total execution time: {total_time:.2f} seconds")
            logger.info(f"Results: course={type(results[0])}, flashcards={len(results[1])}, quiz={len(results[2])}")

            # Generate key points from course sections
            key_points = []
            course = results[0]
            
            # Extract key points from course structure
            if hasattr(course, 'plan') and course.plan:
                key_points = course.plan[:5]  # Take first 5 items from plan as key points
            elif hasattr(course, 'sections') and course.sections:
                # Extract section titles as key points
                for section in course.sections[:5]:  # Limit to 5 key points
                    if hasattr(section, 'titre'):
                        key_points.append(section.titre)
                    elif hasattr(section, 'title'):
                        key_points.append(section.title)
            
            # Generate summary from description or introduction
            summary = ""
            if hasattr(course, 'description'):
                summary = course.description
            elif hasattr(course, 'introduction') and hasattr(course.introduction, 'texte'):
                summary = course.introduction.texte[:500]  # First 500 chars
            elif hasattr(course, 'overview') and hasattr(course.overview, 'objective'):
                summary = course.overview.objective
            
            return ProcessedChapter(
                transcription=text,
                course=results[0],
                flashcards=results[1],
                quiz=results[2],
                key_points=key_points,
                summary=summary
            )

        except Exception as e:
            logger.error(f"Chapter processing error: {str(e)}")
            raise
    
    async def generate_structured_course(
        self,
        text: str,
        chapter_name: str,
        lesson_name: str,
        subject_name: str
    ) -> StructuredCourse:
        """Generate a comprehensive structured course from input text using GPT-5"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; content generation requires OpenAI.")
            logger.info(f"[PARALLEL] Starting comprehensive structured course generation for lesson '{lesson_name}'")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-5",
                    input=[
                        {
                            "role": "developer",
                            "content": """Tu es un expert pédagogique qui crée des cours structurés et intemporels. Tu dois produire un JSON avec la structure exacte suivante.

RÈGLES CRITIQUES DE FORMATAGE :

1. **GRAS SÉLECTIF** : Mets en **gras** UNIQUEMENT les termes vraiment importants (concepts nouveaux, définitions clés). Maximum 5-10% du texte.
2. **PARAGRAPHES COURTS ET NOMBREUX** : 2-3 phrases par paragraphe, puis \\n\\n. Tu peux avoir plusieurs paragraphes consécutifs.
3. **UTILISE DES LISTES POUR CLARIFIER** : Utilise des listes à puces ou numérotées quand cela aide à clarifier des idées ou organiser l'information.
4. **STRUCTURE OBLIGATOIRE** : TOUT le contenu d'une section DOIT être dans des sous-sections.

GUIDE D'UTILISATION DES TYPES DE CONTENU :

1. **TEXTE** : Explications claires et bien structurées.
   - Paragraphes de 2-3 phrases maximum, séparés par \\n\\n
   - Plusieurs paragraphes consécutifs sont possibles et encouragés
   - Utilise des listes quand cela clarifie l'information :
     * Liste à puces : "\\n- Premier point\\n- Deuxième point"
     * Liste numérotée : "\\n1. Première étape\\n2. Deuxième étape"
   - Gras seulement pour les mots-clés essentiels
   - Formules inline : $formule$ dans le texte
   - Pour les flèches : utilise → ← ⇒ ⇐ ou $\\rightarrow$ $\\leftarrow$
   - Chimie : $H_2O$ (eau), $CO_2$ (dioxyde de carbone), $Na^+$ (ion sodium)
   - Puissances : $x^2$ (x au carré), $10^{-3}$ (10 puissance -3)

2. **DÉFINITION** : Pour les termes techniques importants.
   - "titre" = le terme à définir
   - "valeur" = définition claire et concise

3. **EXEMPLE** : OBLIGATOIRE après chaque concept important.
   - Commence par "Exemple :" (sans gras)
   - Cas concret bien structuré
   - Utilise des listes quand cela aide à clarifier les étapes

4. **FORMULE** : Pour les expressions mathématiques.
   - Format : $$formule$$ pour les formules en bloc
   - Dans le texte : $formule$ pour les formules inline

5. **MINDMAP** : Pour visualiser les relations entre concepts.
   - Format Mermaid avec structure claire
   - Hiérarchie logique

6. **SOUS-SECTION** : Structure obligatoire.
   - Tout contenu doit être dans des sous-sections
   - Chaque sous-section : plusieurs paragraphes d'explication + exemple(s)

STRUCTURE OBLIGATOIRE D'UNE SECTION :
{
  "titre": "Titre de la section principale",
  "contenu": [
    {
      "type": "sous-section",
      "titre": "Premier aspect du sujet",
      "contenu": [
        {
          "type": "texte",
          "valeur": "Le **concept principal** se définit par ses caractéristiques essentielles.\\n\\nIl existe trois aspects fondamentaux :\\n\\n1. Premier aspect avec explication\\n2. Deuxième aspect important\\n3. Troisième aspect complémentaire\\n\\nLa formule $f(x) = ax + b$ représente la forme générale."
        },
        {
          "type": "definition",
          "titre": "Terme clé",
          "valeur": "Définition claire et précise du terme."
        },
        {
          "type": "exemple",
          "valeur": "Exemple : Considérons une fonction linéaire.\\n\\nÉtapes de résolution :\\n\\n1. Identifier les paramètres\\n2. Appliquer la formule\\n3. Vérifier le résultat\\n\\nLe résultat final est x = 5."
        }
      ]
    },
    {
      "type": "sous-section",
      "titre": "Deuxième aspect du sujet",
      "contenu": [
        {
          "type": "texte",
          "valeur": "Développement avec **beaucoup de gras** et des paragraphes bien séparés."
        }
      ]
    }
  ]
}

FORMATAGE OPTIMAL :
- **Gras** : Seulement 5-10% du texte (termes nouveaux, concepts clés)
- **Paragraphes** : 2-3 phrases maximum, puis \\n\\n. Tu peux enchaîner plusieurs paragraphes.
- **Listes** : Utilise-les quand cela clarifie l'information
- **Structure claire** : Introduction → Développement → Exemples

EXEMPLE DE TEXTE BIEN STRUCTURÉ :
"Le **concept principal** se comprend à travers son contexte historique. Il a été développé pour répondre à un besoin spécifique.\\n\\nSon application moderne diffère légèrement de sa forme originale. Les adaptations ont permis une meilleure intégration.\\n\\nCela nous conduit naturellement vers le concept suivant."

EXEMPLE AVEC LISTE POUR CLARIFIER :
"Les caractéristiques principales sont :\\n\\n- Première caractéristique\\n- Deuxième caractéristique\\n- Troisième caractéristique"

EXEMPLE DE DESCRIPTION BIEN STRUCTURÉE :
"description": "Ce cours explore les **fondamentaux** de [sujet].\\n\\nObjectifs d'apprentissage :\\n\\n1. Comprendre les principes de base\\n2. Maîtriser les techniques essentielles\\n3. Appliquer les connaissances en pratique\\n\\nÀ l'issue de ce cours, vous saurez utiliser ces concepts dans des situations réelles.\\n\\nAucun prérequis n'est nécessaire, seulement de la curiosité."

STRUCTURE JSON COMPLÈTE :
{
  "titre_cours": "Titre clair et engageant",
  "description": "[Description structurée avec listes et paragraphes courts]",
  "introduction": {
    "texte": "Bienvenue dans ce cours sur les **fondamentaux** de [sujet].\\n\\nCe cours est structuré en trois parties :\\n\\n1. Les bases théoriques essentielles\\n2. Les applications pratiques\\n3. Les cas d'usage avancés\\n\\nChaque section comprend des exemples concrets et des exercices.\\n\\nCommençons par explorer les concepts de base."
  },
  "plan": [
    "Les fondamentaux essentiels",
    "Applications pratiques et exemples",
    "Concepts avancés et perspectives"
  ],
  "sections": [
    {
      "titre": "Section principale",
      "contenu": [
        {
          "type": "sous-section",
          "titre": "Titre explicite de la sous-section",
          "contenu": [
            {
              "type": "texte",
              "valeur": "Introduction au concept avec une explication claire.\\n\\nLes points essentiels sont :\\n\\n- Point numéro un\\n- Point numéro deux\\n- Point numéro trois"
            },
            {
              "type": "exemple",
              "valeur": "Exemple : Application concrète du concept.\\n\\nProcédure :\\n\\n1. Première étape\\n2. Deuxième étape\\n3. Résultat obtenu"
            }
          ]
        }
      ]
    }
  ],
  "conclusion": {
    "texte": "Pour conclure, nous avons exploré les **concepts essentiels** de ce chapitre.\\n\\nPoints clés à retenir :\\n\\n- Premier concept fondamental et son application\\n- Deuxième principe important à maîtriser\\n- Troisième élément clé pour la pratique\\n\\nCes notions vous serviront de base pour les chapitres suivants.\\n\\nN'hésitez pas à revoir les exemples pour bien assimiler ces concepts."
  },
  "references": []
}"""
                        },
                        {
                            "role": "user",
                            "content": f"""Crée un cours structuré à partir de ce contenu :

Matière: {subject_name}
Leçon: {lesson_name}
Chapitre: {chapter_name}

Contenu brut:
{text}

CONSIGNES CRITIQUES :
1. Filtre tout élément personnel ou temporel (salutations, dates, références au prof)
2. Conserve uniquement le contenu académique pur
3. STRUCTURE OBLIGATOIRE : Toutes les sections contiennent UNIQUEMENT des sous-sections
4. FORMATAGE OPTIMAL :
   - Paragraphes de 2-3 phrases maximum, séparés par \\n\\n
   - Tu peux avoir plusieurs paragraphes consécutifs pour développer une idée
   - Utilise des listes quand cela clarifie l'information
   - Gras uniquement pour les termes importants (5-10% du texte)
5. Chaque sous-section contient :
   - Plusieurs paragraphes d'explication si nécessaire
   - Au moins un exemple concret
   - Structure adaptée au contenu
6. Pour les formules et symboles :
   - Formules inline : $formule$ dans le texte
   - Flèches directes : → ← ⇒ ⇐ ↔
   - Ou LaTeX : $\\rightarrow$ $\\leftarrow$ etc.
   - Notations chimiques : $H_2O$, $CO_2$, $Na^+$, $Cl^-$
   - Puissances : $x^2$, $10^3$, $E = mc^2$
7. Privilégie la clarté et l'aération naturelle du texte"""
                        }
                    ],
                    text={
                        "format": {
                            "type": "json_object"
                        },
                        "verbosity": "high"
                    },
                    reasoning={
                        "effort": "minimal"
                    },
                    tools=[],
                    store=True
                )

                import json
                result_data = json.loads(response.output_text)
                return StructuredCourse(**result_data)

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _generate)

            logger.info(f"[PARALLEL] Comprehensive course generation completed for lesson '{lesson_name}'")
            return result

        except Exception as e:
            logger.error(f"Course generation error: {str(e)}")
            raise
    
    async def generate_flashcards(self, text: str, max_cards: int = 20) -> List[Flashcard]:
        """Generate flashcards from text using GPT-4.1"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; flashcard generation requires OpenAI.")
            logger.info(f"[PARALLEL] Starting flashcards generation (max {max_cards} cards)")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-4.1",
                    input=[
                        {
                            "role": "developer",
                            "content": """You are an expert at creating educational flashcards designed to output JSON.
Extract ALL key terms, concepts, and definitions from the text.
Create comprehensive flashcards that cover the entire content.
Each flashcard should help students memorize important information.

Return a JSON array of flashcards with this exact structure:
[
  {
    "term": "string",
    "definition": "string",
    "example": "string (optional)"
  }
]"""
                        },
                        {
                            "role": "user",
                            "content": f"""Create flashcards from this text. Include ALL important terms and concepts:

{text}

Generate at least {max_cards} flashcards covering all key concepts."""
                        }
                    ],
                    text={"format": {"type": "json_object"}}
                )

                import json
                flashcards_data = json.loads(response.output_text)
                if isinstance(flashcards_data, dict):
                    # If it's a dict, try to find the flashcards in it
                    if 'flashcards' in flashcards_data:
                        flashcards_data = flashcards_data['flashcards']
                    else:
                        # Convert dict to list if it's a single flashcard
                        flashcards_data = [flashcards_data]
                if not isinstance(flashcards_data, list):
                    raise ValueError(f"Expected list or dict with flashcards, got {type(flashcards_data)}")
                result = [Flashcard(**card) for card in flashcards_data]
                return result[:max_cards] if len(result) > max_cards else result

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _generate)

            logger.info(f"[PARALLEL] Flashcards generation completed: {len(result)} cards")
            return result

        except Exception as e:
            logger.error(f"Flashcard generation error: {str(e)}")
            raise
    
    async def generate_quiz(self, text: str, num_questions: int = 10) -> List[QuizQuestion]:
        """Generate quiz questions from text using GPT-4.1"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; quiz generation requires OpenAI.")
            logger.info(f"[PARALLEL] Starting quiz generation ({num_questions} questions)")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-4.1",
                    input=[
                        {
                            "role": "developer",
                            "content": """You are an expert quiz creator designed to output JSON.
Create challenging but fair multiple-choice questions that test understanding of the material.
Each question should have exactly 3 options with one correct answer.
Provide clear explanations for the correct answer.

Return a JSON array of quiz questions with this exact structure:
[
  {
    "question": "string",
    "options": ["option1", "option2", "option3"],
    "correct_answer": 0,
    "explanation": "string"
  }
]"""
                        },
                        {
                            "role": "user",
                            "content": f"""Create {num_questions} quiz questions from this text:

{text}

Ensure questions cover different aspects of the content and test real understanding."""
                        }
                    ],
                    text={"format": {"type": "json_object"}}
                )

                import json
                questions_data = json.loads(response.output_text)
                if isinstance(questions_data, dict):
                    # If it's a dict, try to find the questions in it
                    if 'questions' in questions_data:
                        questions_data = questions_data['questions']
                    elif 'quiz' in questions_data:
                        questions_data = questions_data['quiz']
                    else:
                        # Convert dict to list if it's a single question
                        questions_data = [questions_data]
                if not isinstance(questions_data, list):
                    raise ValueError(f"Expected list or dict with questions, got {type(questions_data)}")
                result = [QuizQuestion(**question) for question in questions_data]
                return result[:num_questions] if len(result) > num_questions else result

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _generate)

            logger.info(f"[PARALLEL] Quiz generation completed: {len(result)} questions")
            return result

        except Exception as e:
            logger.error(f"Quiz generation error: {str(e)}")
            raise
    
    async def chat_with_context(
        self,
        message: str,
        context: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Chat with AI about the course content"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; chat requires OpenAI.")
            logger.info("Processing chat message")

            def _chat():
                input_messages = [
                    {
                        "role": "developer",
                        "content": f"""You are an AI tutor helping a student understand their course material.

Course Content:
{context}

Be helpful, encouraging, and provide clear explanations.
Answer questions based on the course content provided.
If asked about something not in the course, politely redirect to the course material."""
                    }
                ]

                # Add chat history
                if chat_history:
                    for msg in chat_history[-10:]:  # Keep last 10 messages for context
                        input_messages.append({
                            "role": msg.get("role", "user"),
                            "content": msg.get("content", "")
                        })

                # Add current message
                input_messages.append({
                    "role": "user",
                    "content": message
                })

                response = self.client.responses.create(
                    model="gpt-4.1",
                    input=input_messages
                )

                return response.output_text

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _chat)

            logger.info("Chat response generated")
            return result

        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            raise
    
