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
                self.generate_flashcards(text),  # No limit - let AI generate optimal count
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
                    model="gpt-5-mini",
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
    
    async def generate_flashcards(self, text: str, max_cards: Optional[int] = None) -> List[Flashcard]:
        """Generate flashcards from text using GPT-5-mini with comprehensive French pedagogical prompt"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; flashcard generation requires OpenAI.")
            max_cards_str = f"up to {max_cards}" if max_cards else "unlimited"
            logger.info(f"[PARALLEL] Starting flashcards generation ({max_cards_str} cards)")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-5-mini",
                    input=[
                        {
                            "role": "developer",
                            "content": [
                                {
                                    "type": "input_text",
                                    "text": """Tu es un générateur de flashcards pédagogiques. À partir du contenu de cours fourni, tu dois extraire et créer des flashcards COURTES, CIBLÉES et NOMBREUSES qui permettent d'apprendre sans avoir le cours sous les yeux.

## PRINCIPE FONDAMENTAL : ATOMICITÉ, CONCISION ET INDÉPENDANCE TOTALE

Chaque flashcard doit être :
- **COURTE** : 1 concept = 1 flashcard (ne pas regrouper plusieurs idées)
- **CIBLÉE** : Une seule information testable par carte
- **TOTALEMENT INDÉPENDANTE** : Compréhensible par quelqu'un qui n'a JAMAIS vu le cours
- **AUTONOME** : Aucune référence au cours ("comme vu", "cette méthode", "ce type")
- **AUTO-SUFFISANTE** : Tous les termes et contextes nécessaires sont inclus dans la flashcard
- **CONCISE** : Réponse en 1-3 phrases MAXIMUM

**DIVISER plutôt que regrouper** : Si un sujet a plusieurs aspects, crée plusieurs flashcards distinctes.

## Types de flashcards à créer (clé "type")

Chaque flashcard doit avoir un type qui indique la nature de la réponse attendue :

- **definition** : Définir un terme, concept ou acronyme
- **fait** : Donner une donnée factuelle, chiffre, date
- **formule** : Énoncer une équation ou un calcul
- **comparaison** : Différencier deux éléments
- **procedure** : Décrire une étape ou une méthode
- **exemple** : Illustrer par un cas concret
- **classification** : Catégoriser ou lister un type
- **cause** : Expliquer une origine ou raison
- **consequence** : Décrire un effet ou résultat
- **indication** : Préciser quand utiliser/appliquer

## Règles d'extraction INTENSIVES

Crée UNE flashcard pour CHAQUE :
- **Terme technique** → 1 flashcard (type: definition)
- **Fait chiffré** → 1 flashcard (type: fait)
- **Caractéristique clinique** → 1 flashcard (type: classification ou fait)
- **Étape de processus** → 1 flashcard (type: procedure)
- **Critère d'une liste** → 1 flashcard (type: classification)
- **Différence entre 2 concepts** → 1 flashcard (type: comparaison)
- **Cause/conséquence** → 1 flashcard (type: cause ou consequence)
- **Indication/contre-indication** → 1 flashcard (type: indication)
- **Complication** → 1 flashcard (type: consequence)

**STRATÉGIE DE DIVISION :**
- Liste de 3 signes cliniques → 3 flashcards (1 par signe)
- Processus en 4 étapes → 4 flashcards (1 par étape)
- Formule avec 3 variables → 2-3 flashcards (formule + variables si complexes)
- Comparaison A vs B → 1-2 flashcards selon complexité

## RÈGLES CRITIQUES D'INDÉPENDANCE

❌ **JAMAIS de références implicites** :
- ❌ "Cette technique permet..."
- ❌ "Comme mentionné précédemment..."
- ❌ "Dans ce cas..."
- ❌ "Cette pathologie..."
- ❌ "Ce traitement..."

✅ **TOUJOURS expliciter** :
- ✅ "La technique X permet..."
- ✅ "Le syndrome de Poland..."
- ✅ "En cas de brûlure circulaire..."
- ✅ "La formule de Parkland..."
- ✅ "L'escharotomie..."

**Chaque flashcard doit fonctionner SEULE, mélangée avec des flashcards d'autres cours.**

## Critères de qualité

✓ INCLURE et DIVISER :
- Chaque information testable séparément
- Chaque élément d'une énumération
- Chaque caractéristique distinctive
- Chaque étape d'un protocole
- Le contexte minimal pour comprendre SANS le cours

✗ EXCLURE :
- Informations redondantes
- Détails non essentiels
- Références au document source

## Format de sortie OBLIGATOIRE
```json
[
  {
    "type": "definition",
    "recto": "Question ou terme précis",
    "verso": "Réponse courte et claire (1-3 phrases max)."
  },
  {
    "type": "fait",
    "recto": "Autre question ciblée",
    "verso": "Autre réponse concise."
  }
]
```

## Exemples de flashcards COURTES, CIBLÉES et INDÉPENDANTES

**MAUVAIS (références implicites, trop long) :**
```json
{
  "type": "definition",
  "recto": "Quelles sont les phases et leurs caractéristiques ?",
  "verso": "Phase G1: croissance. Phase S: réplication. Phase G2: préparation. Phase M: division."
}
```

**BON (divisé, explicite, indépendant) :**
```json
[
  {
    "type": "definition",
    "recto": "Phase G1 du cycle cellulaire : fonction principale",
    "verso": "Phase de croissance cellulaire avec synthèse protéique active avant la réplication de l'ADN."
  },
  {
    "type": "fait",
    "recto": "Phase S du cycle cellulaire : événement majeur",
    "verso": "Réplication complète de l'ADN (duplication du génome entier)."
  },
  {
    "type": "definition",
    "recto": "Phase G2 du cycle cellulaire : rôle",
    "verso": "Phase de préparation à la mitose avec vérification de la réplication et réparation d'erreurs."
  },
  {
    "type": "procedure",
    "recto": "Phase M du cycle cellulaire : déroulement",
    "verso": "Division cellulaire en deux étapes : mitose (séparation des chromosomes) puis cytokinèse (séparation du cytoplasme)."
  }
]
```

**Autres exemples avec types variés :**
```json
[
  {
    "type": "formule",
    "recto": "Théorème de Pythagore : équation",
    "verso": "a² + b² = c² où c est l'hypoténuse du triangle rectangle."
  },
  {
    "type": "fait",
    "recto": "Capitale du Japon",
    "verso": "Tokyo (environ 14 millions d'habitants dans la préfecture)."
  },
  {
    "type": "formule",
    "recto": "Photosynthèse : équation chimique simplifiée",
    "verso": "6CO₂ + 6H₂O + lumière → C₆H₁₂O₆ + 6O₂"
  },
  {
    "type": "fait",
    "recto": "Révolution française : année de début",
    "verso": "1789, déclenchée par la prise de la Bastille le 14 juillet."
  },
  {
    "type": "definition",
    "recto": "HTTP : signification",
    "verso": "HyperText Transfer Protocol (protocole de communication web entre client et serveur)."
  },
  {
    "type": "comparaison",
    "recto": "Différence entre RAM et ROM",
    "verso": "RAM = mémoire volatile effacée à l'extinction. ROM = mémoire permanente en lecture seule."
  },
  {
    "type": "fait",
    "recto": "Vitesse de la lumière dans le vide",
    "verso": "Environ 300 000 km/s (valeur exacte : 299 792 458 m/s)."
  },
  {
    "type": "definition",
    "recto": "Première loi de Newton (principe d'inertie)",
    "verso": "Un corps reste au repos ou en mouvement rectiligne uniforme tant qu'aucune force extérieure n'agit sur lui."
  },
  {
    "type": "definition",
    "recto": "ADN : signification de l'acronyme",
    "verso": "Acide DésoxyriboNucléique, molécule support de l'information génétique."
  },
  {
    "type": "exemple",
    "recto": "Python : déclarer une liste vide (2 méthodes)",
    "verso": "ma_liste = [] ou ma_liste = list()"
  },
  {
    "type": "consequence",
    "recto": "Conséquence d'une carence en vitamine C",
    "verso": "Scorbut : maladie provoquant fatigue, saignements gingivaux et cicatrisation difficile."
  },
  {
    "type": "cause",
    "recto": "Cause principale de la rouille du fer",
    "verso": "Oxydation du fer au contact de l'oxygène et de l'humidité (eau)."
  }
]
```

## FORMAT ULTRA COMPLET POUR LES FORMULES MATHÉMATIQUES ET PHYSIQUES (LATEX)

### Système de Balises LaTeX OBLIGATOIRES

Tu DOIS générer les formules avec ces balises LaTeX exactes (comme ChatGPT) :

**1. FORMULE EN LIGNE** (dans le texte, petites formules):
- TOUJOURS utiliser: \\( formule \\)
- Exemple: \\(E_c\\) pour l'énergie cinétique dans une phrase
- Quand: variable ou petite formule dans le texte explicatif

**2. FORMULE CENTRÉE** (affichée, mise en avant):
- TOUJOURS utiliser: \\[ formule \\]
- Exemple: \\[E_c = \\frac{1}{2}mv^2\\]
- Quand: formule principale, résultat important

### Pour les flashcards de type "formule":

**Structure OBLIGATOIRE** :
1. Formule principale entre \\[ et \\] (centrée, bien visible)
2. Double saut de ligne \\n\\n
3. Texte "Où:" suivi des définitions des variables
4. Chaque variable inline entre \\( et \\)
5. Unités SI systématiques entre parenthèses

**SYNTAXE LATEX À UTILISER** :
- Fractions: \\frac{numerateur}{denominateur}
- Indices: underscore (E_c, m_1, H_2O)
- Exposants: chapeau (x^2, 10^{-11})
- Lettres grecques: \\alpha \\beta \\gamma \\Delta \\omega \\rho \\Omega
- Racine: \\sqrt{x}
- Opérateurs: \\times \\div \\approx \\leq \\geq
- Maximum 4 variables par flashcard
- Si formule complexe → diviser en plusieurs flashcards

**Exemples PARFAITS avec LaTeX** :

**RAPPEL CRITIQUE**: Dans le JSON, DOUBLER tous les backslash !
- Écrire \\\\[ au lieu de \\[
- Écrire \\\\( au lieu de \\(
- Écrire \\\\n au lieu de \\n
- Sinon le JSON ne se parsera pas !

```json
[
  {
    "type": "formule",
    "recto": "Énergie cinétique : formule",
    "verso": "\\\\[E_c = \\\\frac{1}{2}mv^2\\\\]\\\\n\\\\nOù \\\\(m\\\\) = masse (kg), \\\\(v\\\\) = vitesse (m/s), \\\\(E_c\\\\) = énergie cinétique (J)."
  },
  {
    "type": "formule",
    "recto": "Loi d'Ohm : relation tension-courant",
    "verso": "\\\\[U = RI\\\\]\\\\n\\\\nOù \\\\(U\\\\) = tension (V), \\\\(R\\\\) = résistance (\\\\(\\\\Omega\\\\)), \\\\(I\\\\) = intensité (A)."
  },
  {
    "type": "formule",
    "recto": "Force de gravitation universelle",
    "verso": "\\\\[F = G\\\\frac{m_1 m_2}{r^2}\\\\]\\\\n\\\\nOù \\\\(F\\\\) = force (N), \\\\(G = 6.674 \\\\times 10^{-11}\\\\) N·m²/kg², \\\\(m_1, m_2\\\\) = masses (kg), \\\\(r\\\\) = distance (m)."
  },
  {
    "type": "formule",
    "recto": "Pression hydrostatique",
    "verso": "\\\\[P = \\\\rho g h\\\\]\\\\n\\\\nOù \\\\(P\\\\) = pression (Pa), \\\\(\\\\rho\\\\) = masse volumique (kg/m³), \\\\(g = 9.81\\\\) m/s², \\\\(h\\\\) = profondeur (m)."
  },
  {
    "type": "formule",
    "recto": "Équation des gaz parfaits",
    "verso": "\\\\[PV = nRT\\\\]\\\\n\\\\nOù \\\\(P\\\\) = pression (Pa), \\\\(V\\\\) = volume (m³), \\\\(n\\\\) = quantité de matière (mol), \\\\(R = 8.314\\\\) J/(mol·K), \\\\(T\\\\) = température (K)."
  },
  {
    "type": "formule",
    "recto": "Énergie potentielle de pesanteur",
    "verso": "\\\\[E_p = mgh\\\\]\\\\n\\\\nOù \\\\(E_p\\\\) = énergie potentielle (J), \\\\(m\\\\) = masse (kg), \\\\(g = 9.81\\\\) m/s², \\\\(h\\\\) = hauteur (m)."
  }
]
```

**Pour les réactions chimiques** :
- LaTeX chimie: \\\\ce{H2O} ou \\\\ce{2H2 + O2 -> 2H2O}
- Ou notation simple avec indices Unicode: H₂O, CO₂, Na⁺, Cl⁻
- Priorité: indices/exposants Unicode simples si court

**RÈGLES ABSOLUES - VÉRIFIE SYSTÉMATIQUEMENT** :
- Formule principale: TOUJOURS entre \\\\[ et \\\\] (doubler les backslash dans JSON!)
- Variables dans texte: TOUJOURS entre \\\\( et \\\\) (doubler les backslash dans JSON!)
- TOUS les symboles mathématiques en LaTeX (avec backslash doublés)
- JAMAIS mélanger LaTeX et Unicode dans une même formule
- Regarde bien les exemples JSON ci-dessus pour le format exact avec \\\\

## Règles pour le JSON

**ATTENTION ÉCHAPPEMENT JSON OBLIGATOIRE** :
- Dans le JSON, TOUS les backslash doivent être DOUBLÉS
- Écrire \\\\[ et NON \\[ (sinon erreur de parsing)
- Écrire \\\\( et NON \\( (sinon erreur de parsing)
- Écrire \\\\n pour les retours à la ligne

**Structure du JSON** :
- Clé "type": UN SEUL MOT parmi (definition, fait, formule, comparaison, procedure, exemple, classification, cause, consequence, indication)
- Clé "recto": Question ou terme PRÉCIS, COURT et AUTONOME
- Clé "verso": Réponse en 1-3 phrases MAXIMUM avec TOUS les éléments de contexte
- Pour les formules: TOUJOURS doubler les backslashes (voir exemples ci-dessus)
- JSON valide et parsable
- Réponds UNIQUEMENT avec l'array JSON

## Instructions critiques pour MAXIMISER le nombre de flashcards

- Parcours le contenu de manière EXHAUSTIVE dans l'ordre
- **DIVISE systématiquement** : 2-3 infos distinctes → 2-3 flashcards
- Ne saute AUCUNE information testable
- **Préfère 3 flashcards courtes à 1 flashcard longue**
- Vise la GRANULARITÉ MAXIMALE : chaque concept atomique = 1 carte
- **VÉRIFIE l'indépendance** : quelqu'un qui n'a jamais vu le cours doit comprendre
- **EXPLICITE tout** : noms complets, contextes, définitions intégrées
- Si tu hésites entre regrouper ou diviser → DIVISE
- Si une flashcard fait référence à "ce/cette/ces" → REFORMULE avec le terme exact

Applique cette méthodologie de manière SYSTÉMATIQUE et DÉTERMINISTE.

Réponds UNIQUEMENT avec l'array JSON, sans texte avant ou après."""
                                }
                            ]
                        },
                        {
                            "role": "user",
                            "content": f"""Crée des flashcards à partir de ce contenu de cours :

{text}

Génère au moins {max_cards} flashcards en suivant EXACTEMENT les règles ci-dessus."""
                        }
                    ],
                    text={
                        "format": {
                            "type": "text"
                        },
                        "verbosity": "high"
                    },
                    reasoning={
                        "effort": "low"
                    },
                    tools=[],
                    store=True,
                    include=[
                        "reasoning.encrypted_content",
                        "web_search_call.action.sources"
                    ]
                )

                import json
                # Parse the response - expecting a JSON array directly
                output = response.output_text.strip()
                flashcards_data = json.loads(output)
                
                if not isinstance(flashcards_data, list):
                    raise ValueError(f"Expected list of flashcards, got {type(flashcards_data)}")
                
                result = [Flashcard(**card) for card in flashcards_data]
                # Return all flashcards generated (the new prompt is designed to create optimal count)
                # Only limit if max_cards is explicitly specified (not None)
                if max_cards is not None and len(result) > max_cards:
                    logger.warning(f"Generated {len(result)} flashcards, limiting to {max_cards}")
                    return result[:max_cards]
                return result

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _generate)

            logger.info(f"[PARALLEL] Flashcards generation completed: {len(result)} cards")
            return result

        except Exception as e:
            logger.error(f"Flashcard generation error: {str(e)}")
            raise
    
    async def generate_quiz(self, text: str, num_questions: int = 10) -> List[QuizQuestion]:
        """Generate quiz questions from text using GPT-5-mini with new API format"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; quiz generation requires OpenAI.")
            logger.info(f"[PARALLEL] Starting quiz generation ({num_questions} questions)")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-5-mini",
                    input=[
                        {
                            "role": "developer",
                            "content": [
                                {
                                    "type": "input_text",
                                    "text": """You are an expert quiz creator designed to output JSON.
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
]

IMPORTANT: Return ONLY the JSON array, without any additional text or markdown formatting."""
                                }
                            ]
                        },
                        {
                            "role": "user",
                            "content": f"""Create {num_questions} quiz questions from this text:

{text}

Ensure questions cover different aspects of the content and test real understanding."""
                        }
                    ],
                    text={
                        "format": {
                            "type": "text"
                        },
                        "verbosity": "high"
                    },
                    reasoning={
                        "effort": "low"
                    },
                    tools=[],
                    store=True
                )

                import json
                # Parse the response - expecting a JSON array directly
                output = response.output_text.strip()
                questions_data = json.loads(output)
                
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
                    model="gpt-5-mini",
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
    
