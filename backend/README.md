# StudyEasy Backend AI

Backend Python pour l'application StudyEasy utilisant l'API OpenAI (GPT-5 et GPT-4o).

## 🚀 Installation

1. **Créer un environnement virtuel**
```bash
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

2. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

3. **Configuration**
- Copier `.env.example` vers `.env`
- Ajouter votre clé API OpenAI
- Ajouter le chemin vers votre fichier de service Firebase

```bash
cp .env.example .env
```

## 📁 Structure

```
backend/
├── app.py              # Application FastAPI principale
├── ai_service.py       # Service d'IA avec OpenAI
├── models.py           # Modèles Pydantic
├── requirements.txt    # Dépendances Python
└── README.md          # Documentation
```

## 🔧 Endpoints API

### POST `/api/transcribe`
Transcrit un fichier audio en texte.
- **Input**: Fichier audio (multipart/form-data)
- **Output**: `{ "transcription": "..." }`

### POST `/api/process-chapter`
Traite un chapitre complet avec génération de contenu IA.
- **Input**: 
```json
{
  "text": "Contenu du cours...",
  "chapter_name": "Nom du chapitre",
  "lesson_name": "Nom de la leçon",
  "subject_name": "Nom de la matière"
}
```
- **Output**: Chapitre complet avec cours structuré, flashcards, quiz, etc.

### POST `/api/chat`
Chat conversationnel avec le contenu du cours.
- **Input**:
```json
{
  "message": "Question de l'utilisateur",
  "context": "Contenu du cours",
  "chat_history": []
}
```
- **Output**: `{ "message": "Réponse de l'IA", "timestamp": "..." }`

## 🏃‍♂️ Lancement

### Mode développement
```bash
python app.py
```

### Mode production
```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

## 🔑 Fonctionnalités IA

1. **Transcription Audio** (GPT-4o-transcribe)
   - Conversion précise de l'audio en texte
   - Support multilingue

2. **Génération de Cours** (GPT-5)
   - Structure complète et organisée
   - Préservation de toutes les informations essentielles
   - Sections claires et logiques

3. **Flashcards** (GPT-5 + Structured Outputs)
   - Génération automatique de cartes mémoire
   - Termes clés avec définitions
   - Exemples pratiques

4. **Quiz** (GPT-5 + Structured Outputs)
   - Questions à choix multiples
   - 3 options par question
   - Explications détaillées

5. **Chat IA** (GPT-5)
   - Assistant conversationnel
   - Contexte du cours intégré
   - Historique de conversation

## 📝 Notes

- Les appels API sont exécutés en parallèle pour optimiser les performances
- Utilisation de Structured Outputs pour garantir la cohérence des données
- Support complet du traitement asynchrone avec FastAPI
- CORS configuré pour le développement local

## 🔒 Sécurité

- Variables d'environnement pour les clés sensibles
- Validation des données avec Pydantic
- Gestion des erreurs robuste
- Logs détaillés pour le debugging
