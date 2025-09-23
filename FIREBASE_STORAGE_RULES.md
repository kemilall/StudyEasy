# Configuration Firebase Storage - StudyEasy

## 🔐 Règles de sécurité Firebase Storage

Pour que l'upload de fichiers fonctionne correctement, vous devez configurer les règles de sécurité Firebase Storage.

## 📋 Étapes de configuration

### 1. Accédez à Firebase Console
1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet `studyeasy-3fb24`
3. Dans le menu latéral, cliquez sur **Storage**
4. Cliquez sur l'onglet **Rules** (Règles)

### 2. Remplacez les règles par défaut

Copiez et collez ces règles de sécurité :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Fonction pour vérifier si l'utilisateur est authentifié
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Fonction pour vérifier si l'utilisateur est propriétaire
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Fonction pour vérifier le type de fichier
    function isValidAudio() {
      return request.resource.contentType.matches('audio/.*');
    }
    
    function isValidDocument() {
      return request.resource.contentType.matches('application/.*') || 
             request.resource.contentType.matches('text/.*');
    }
    
    function isValidImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // Règles pour les fichiers audio
    match /audio/{userId}/{chapterId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) && isValidAudio() && request.resource.size < 100 * 1024 * 1024; // 100MB max
    }
    
    // Règles pour les documents
    match /documents/{userId}/{chapterId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) && isValidDocument() && request.resource.size < 10 * 1024 * 1024; // 10MB max
    }
    
    // Règles pour les images (matières)
    match /images/subjects/{userId}/{subjectId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) && isValidImage() && request.resource.size < 5 * 1024 * 1024; // 5MB max
    }
  }
}
```

### 3. Publiez les règles

1. Cliquez sur **Publish** (Publier)
2. Attendez que les règles soient activées (quelques secondes)

## 🔧 Configuration CORS (si nécessaire)

Si vous rencontrez toujours des erreurs CORS, créez un fichier `cors.json` :

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

Puis appliquez-le avec gsutil :

```bash
# Installer gsutil si nécessaire
pip install gsutil

# Appliquer la configuration CORS
gsutil cors set cors.json gs://studyeasy-3fb24.firebasestorage.app
```

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **Test d'upload** : Essayez d'uploader un fichier audio dans l'app
2. **Console Storage** : Vérifiez que le fichier apparaît dans Firebase Storage
3. **URL de téléchargement** : Vérifiez que l'URL est accessible

## 🚨 Résolution de problèmes

### Erreur "Network request failed"
- Vérifiez votre connexion internet
- Assurez-vous que les règles sont bien publiées
- Vérifiez que l'utilisateur est authentifié

### Erreur "Unauthorized"
- L'utilisateur doit être connecté
- Vérifiez que le userId dans le path correspond à l'utilisateur connecté

### Erreur "File too large"
- Audio : 100MB maximum
- Documents : 10MB maximum
- Images : 5MB maximum

## 📱 Note pour React Native

L'application utilise maintenant deux méthodes d'upload :

1. **XMLHttpRequest** : Méthode principale, plus fiable
2. **Base64** : Méthode de secours pour les petits fichiers

Les deux méthodes sont automatiquement gérées par `FileUploadService`.

---

✅ **Une fois les règles publiées, l'upload de fichiers devrait fonctionner correctement !**

