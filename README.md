# StudyEasy – Backend & Front

Ce monorepo comprend :

- **Backend FastAPI** (`backend/`) pour orchestrer les appels OpenAI, lancer les traitements audio/texte et exposer des endpoints REST.
- **Application React Native (Expo)** qui consomme l'API (locale ou déployée sur Railway) et gère la persistance côté client dans Firebase (Auth + Firestore + Storage).

---

## 1. Backend FastAPI

### Prérequis

- Python 3.10+
- Variables d'environnement :
  - `OPENAI_API_KEY`
  - `DATABASE_URL` *(optionnel, SQLite par défaut)*

### Installation locale
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # sous Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Lancement local
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Déploiement Railway

1. Créez un projet Railway et connectez le dépôt.
2. Railway détectera le `Procfile` à la racine et lancera automatiquement :
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}
   ```
3. Déclarez les variables d'environnement dans Railway :
   - `OPENAI_API_KEY`
   - (optionnel) `DATABASE_URL` si vous préférez un Postgres Railway.

Le backend gère nativement le port imposé par Railway (`PORT`).

### Points d'API

- `GET /health`
- `GET/POST /subjects`
- `GET/POST /lessons`
- `GET/POST /chapters`
  - `/chapters/from-text`
  - `/chapters/from-audio`
  - `/chapters/from-audio-url` *(récupère l'audio stocké sur Firebase Storage)*
- `GET/POST /chat/{chapterId}`

Les fichiers audio temporaires sont stockés dans `backend/storage/audio`, les transcriptions dans `backend/storage/transcripts`.

---

## 2. Application Expo / React Native

### Dépendances clés

- `firebase` + `@react-native-async-storage/async-storage`
- Contexte d'authentification Firebase (connexion anonyme) utilisé pour :
  - Stocker les données utilisateurs (matières, leçons, chapitres) dans **Firestore**.
  - Uploader les fichiers audio dans **Firebase Storage** avant déclenchement du traitement backend.

### Variables d'environnement Expo

- `EXPO_PUBLIC_API_URL` – URL du backend (Railway conseillé).
  - Exemple : `EXPO_PUBLIC_API_URL=https://studyeasy-production.up.railway.app`

Vous trouverez un fichier `.env.example` à la racine. Copiez-le en `.env` puis lancez :

```bash
npm install
npm start
```

### Fonctionnement côté client

- À l'ouverture, l'app signe l'utilisateur en **anonyme** via Firebase Auth.
- Les listes (matières, leçons, chapitres) sont d'abord hydratées depuis Firestore puis synchronisées avec l'API backend.
- Lors d'une création :
  - Les données sont envoyées au backend (génération OpenAI, stockage SQL).
  - Le résultat est mis en cache dans Firestore pour une consultation rapide/offline.
- Pour un chapitre audio, l'application charge l'audio dans **Firebase Storage** puis envoie l'URL publique au backend (`/chapters/from-audio-url`).

---

## 3. Pipeline pédagogique

- Création de matière / leçon / chapitre (texte ou audio).
- Upload audio ➜ Firebase Storage ➜ backend (transcription GPT-4o) ➜ synthèse GPT-5 (cours, flashcards, quiz).
- Suivi temps réel du statut via `/chapters/{id}` et l'écran "Processing".
- Consultation résumé, transcription, flashcards, quiz, chatbot contextuel.

---

## 4. Tests réalisés

- `python -m compileall backend`
- `npx tsc --noEmit`

Pensez à compléter par des tests E2E (Expo/Backend) une fois les comptes Railway & Firebase configurés.

---

## 5. Points d'attention

- Protégez vos clés (`OPENAI_API_KEY`, Firebase) dans vos environnements d'hébergement (Railway / Expo). Ne les validez pas en clair.
- SQLite est pratique localement mais éphémère sur Railway. Branchez `DATABASE_URL` sur Postgres pour persister les données backend.
- Les collections Firestore sont structurées comme suit :
  - `users/{uid}/subjects`
  - `users/{uid}/lessons`
  - `users/{uid}/chapters`
- Si vous changez de backend URL, mettez à jour `EXPO_PUBLIC_API_URL` et redémarrez l'application Expo.
