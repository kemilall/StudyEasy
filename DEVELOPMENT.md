# Guide de Développement StudyEasy

## Démarrage Rapide

### Option 1: Script Automatique (Recommandé)
```bash
./start-dev.sh
```

Ce script démarre automatiquement :
- Le backend FastAPI sur `http://localhost:8000`
- Expo avec tunnel pour éviter les problèmes de réseau

### Option 2: Démarrage Manuel

#### Backend
```bash
# Activer l'environnement virtuel
source venv/bin/activate

# Démarrer le serveur
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend
```bash
# Avec tunnel (recommandé pour mobile)
EXPO_PUBLIC_API_URL=http://localhost:8000 npx expo start --tunnel

# Ou avec réseau local (si pas de problème de firewall)
EXPO_PUBLIC_API_URL=http://[VOTRE_IP]:8000 npx expo start
```

## Configuration

### Variables d'Environnement
- `EXPO_PUBLIC_API_URL`: URL de l'API backend (défaut: `http://localhost:8000`)

### Résolution des Problèmes

#### Erreur de Connexion Backend
1. Vérifiez que le backend est démarré : `curl http://localhost:8000/health`
2. Utilisez le tunnel Expo si vous avez des problèmes de réseau
3. Vérifiez que le port 8000 n'est pas utilisé par un autre processus

#### Problèmes Expo
1. Effacez le cache : `npx expo start --clear`
2. Redémarrez avec tunnel : `npx expo start --tunnel`
3. Vérifiez que l'app Expo Go est installée sur votre téléphone

## Architecture

- **Backend**: FastAPI avec SQLite
- **Frontend**: React Native avec Expo
- **API**: REST avec CORS activé
- **Base de données**: SQLite locale

## Endpoints API Principaux

- `GET /health` - Vérification de santé
- `GET /subjects` - Liste des matières
- `POST /subjects` - Créer une matière
- `GET /lessons/by-subject/{id}` - Leçons par matière
- `POST /chapters/from-text` - Créer chapitre depuis texte
- `POST /chapters/from-audio` - Créer chapitre depuis audio
