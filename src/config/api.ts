// Pour le développement, utiliser l'IP locale de votre machine
// Remplacez cette IP par celle de votre machine (trouvée avec ifconfig)
const LOCAL_IP = '192.168.1.118';

export const API_BASE_URL = __DEV__
  ? `http://${LOCAL_IP}:8000`
  : 'https://studyeasy-backend.herokuapp.com';

console.log('API_BASE_URL configured:', API_BASE_URL);


