#!/bin/bash

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Démarrage de StudyEasy...${NC}"

# Fonction pour nettoyer les processus à la sortie
cleanup() {
    echo -e "\n${YELLOW}🛑 Arrêt des serveurs...${NC}"
    pkill -f uvicorn
    pkill -f expo
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Démarrer le backend
echo -e "${GREEN}📡 Démarrage du backend...${NC}"
source venv/bin/activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Attendre que le backend soit prêt
echo -e "${YELLOW}⏳ Attente du démarrage du backend...${NC}"
sleep 5

# Vérifier si le backend est accessible
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend démarré avec succès sur http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Erreur: Le backend n'a pas pu démarrer${NC}"
    exit 1
fi

# Démarrer Expo avec tunnel
echo -e "${GREEN}📱 Démarrage d'Expo avec tunnel...${NC}"
EXPO_PUBLIC_API_URL=http://localhost:8000 npx expo start --tunnel &
EXPO_PID=$!

echo -e "${GREEN}🎉 Tout est prêt !${NC}"
echo -e "${YELLOW}📱 Scanne le QR code avec l'app Expo Go sur ton téléphone${NC}"
echo -e "${YELLOW}🔗 L'API sera accessible via le tunnel Expo${NC}"
echo -e "${YELLOW}💡 Appuie sur Ctrl+C pour arrêter les serveurs${NC}"

# Attendre que les processus se terminent
wait $BACKEND_PID $EXPO_PID
