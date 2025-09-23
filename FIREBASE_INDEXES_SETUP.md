# Configuration des Index Firebase - StudyEasy

## 🔥 Index Firebase requis

Votre application Firebase nécessite des index composites pour les requêtes avec plusieurs champs. Voici comment les créer :

## 📋 Index à créer

### 1. Index pour les Leçons (lessons)
**Collection** : `lessons`
**Champs** :
- `subjectId` (Ascending)
- `createdAt` (Ascending)
- `__name__` (Ascending)

### 2. Index pour les Chapitres (chapters)
**Collection** : `chapters`
**Champs** :
- `lessonId` (Ascending)
- `createdAt` (Ascending)
- `__name__` (Ascending)

### 3. Index pour les Matières (subjects)
**Collection** : `subjects`
**Champs** :
- `userId` (Ascending)
- `createdAt` (Ascending)
- `__name__` (Ascending)

## 🛠️ Comment créer les index

### Méthode 1 : Via la Console Firebase (Recommandée)

1. **Accédez à la Console Firebase** : https://console.firebase.google.com/
2. **Sélectionnez votre projet** : `studyeasy-3fb24`
3. **Naviguez vers Firestore** : Database > Firestore Database
4. **Accédez aux Index** : Onglet "Indexes" dans le menu latéral
5. **Créez les index composites** :

#### Pour les Leçons :
```
Collection ID: lessons
Fields:
- subjectId: Ascending
- createdAt: Ascending
Query scope: Collection
```

#### Pour les Chapitres :
```
Collection ID: chapters
Fields:
- lessonId: Ascending
- createdAt: Ascending
Query scope: Collection
```

#### Pour les Matières :
```
Collection ID: subjects
Fields:
- userId: Ascending
- createdAt: Ascending
Query scope: Collection
```

### Méthode 2 : Via les Liens d'erreur

Quand l'erreur apparaît dans les logs, Firebase fournit un lien direct vers la création de l'index. 

**Exemple de lien d'erreur** :
```
https://console.firebase.google.com/v1/r/project/studyeasy-3fb24/firestore/indexes?create_composite=...
```

1. **Copiez le lien** depuis l'erreur dans la console
2. **Ouvrez le lien** dans votre navigateur
3. **Cliquez sur "Create Index"**
4. **Attendez la création** (peut prendre quelques minutes)

### Méthode 3 : Via Firebase CLI

Si vous avez Firebase CLI installé :

```bash
# Installer Firebase CLI si nécessaire
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Initialiser les index (créer firestore.indexes.json)
firebase init firestore

# Déployer les index
firebase deploy --only firestore:indexes
```

**Contenu du fichier `firestore.indexes.json`** :
```json
{
  "indexes": [
    {
      "collectionGroup": "lessons",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "subjectId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "chapters",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "lessonId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "subjects",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

## ⏱️ Temps de création

- **Index simples** : 1-2 minutes
- **Index composites** : 5-15 minutes
- **Index sur de gros datasets** : Peut prendre plusieurs heures

## ✅ Vérification

Une fois les index créés :

1. **Statut** : Vérifiez que le statut est "Building" puis "Enabled"
2. **Test** : Relancez l'application pour vérifier que les erreurs ont disparu
3. **Performance** : Les requêtes devraient être plus rapides

## 🚨 Notes importantes

- **Production** : Ces index sont essentiels pour l'application en production
- **Coût** : Les index ont un coût de stockage minimal
- **Maintenance** : Les index se maintiennent automatiquement
- **Backup** : Les index sont inclus dans les exports Firestore

## 🔧 Règles de sécurité Firestore

N'oubliez pas de configurer les règles de sécurité Firestore :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /subjects/{subjectId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /lessons/{lessonId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /chapters/{chapterId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

✅ **Une fois les index créés, redémarrez l'application pour vérifier que les erreurs ont disparu !**
