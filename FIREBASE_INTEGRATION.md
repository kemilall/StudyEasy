# Intégration Firebase - StudyEasy

## 🚀 Changements apportés

L'application StudyEasy a été entièrement intégrée avec Firebase pour offrir une expérience complète avec authentification, stockage en temps réel et upload de fichiers.

## 📋 Fonctionnalités implémentées

### 🔐 Authentification
- **Connexion/Inscription** avec email et mot de passe
- **Gestion des profils utilisateur** avec Firebase Auth
- **Persistance de session** automatique
- **Déconnexion sécurisée**

### 🗄️ Base de données (Firestore)
- **Stockage des matières** par utilisateur
- **Gestion des leçons** avec compteurs automatiques
- **Chapitres avec contenu AI** généré
- **Mises à jour en temps réel** pour tous les écrans

### 📁 Stockage (Firebase Storage)
- **Upload d'audios** avec barre de progression
- **Upload de documents** pour les chapitres
- **Gestion automatique des URLs** de téléchargement
- **Organisation par utilisateur et chapitre**

### 🤖 Génération IA (Factice)
- **Transcription automatique** des audios
- **Résumés intelligents** du contenu
- **Points clés** extraits automatiquement
- **Flashcards** générées à partir du contenu
- **Quiz** avec questions et explications

## 🏗️ Structure des nouvelles fonctionnalités

### Services créés
- `src/config/firebase.ts` - Configuration Firebase
- `src/services/authService.ts` - Gestion de l'authentification
- `src/services/dataService.ts` - CRUD pour matières, leçons, chapitres
- `src/services/storageService.ts` - Upload et gestion de fichiers
- `src/services/aiService.ts` - Génération de contenu IA (factice)

### Contexte d'authentification
- `src/contexts/AuthContext.tsx` - Gestion globale de l'état d'authentification

### Nouveaux écrans
- `src/screens/LoginScreen.tsx` - Écran de connexion
- `src/screens/SignUpScreen.tsx` - Écran d'inscription
- `src/screens/CreateLessonScreen.tsx` - Création de leçons

### Écrans mis à jour
- **HomeScreen** - Affichage des données utilisateur en temps réel
- **CreateSubjectScreen** - Sauvegarde dans Firebase
- **AudioImportScreen** - Upload vers Firebase Storage + génération IA
- **SettingsScreen** - Affichage profil utilisateur + déconnexion
- **AppNavigator** - Gestion conditionelle auth/app

## 🔄 Flux d'utilisation

### Premier démarrage
1. L'utilisateur arrive sur l'écran de connexion
2. Il peut créer un compte ou se connecter
3. Une fois authentifié, il accède à l'application

### Création de contenu
1. **Créer une matière** → Écran d'accueil → "Nouvelle matière"
2. **Créer une leçon** → Écran d'accueil → "Nouvelle leçon" (nécessite une matière)
3. **Ajouter un chapitre** → Via une leçon → "Importer audio/texte"

### Import et traitement
1. Sélection d'un fichier audio ou texte
2. Upload vers Firebase Storage avec progression
3. Traitement IA automatique (factice)
4. Génération de : transcription, résumé, points clés, flashcards, quiz

## 💾 Structure des données

### Utilisateurs (`users`)
```typescript
{
  uid: string,
  email: string,
  displayName: string,
  createdAt: Date,
  lastLoginAt: Date
}
```

### Matières (`subjects`)
```typescript
{
  id: string,
  userId: string,
  name: string,
  color: string,
  imageUrl?: string,
  lessonsCount: number,
  completedLessons: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Leçons (`lessons`)
```typescript
{
  id: string,
  userId: string,
  subjectId: string,
  name: string,
  description?: string,
  chaptersCount: number,
  completedChapters: number,
  duration: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Chapitres (`chapters`)
```typescript
{
  id: string,
  userId: string,
  lessonId: string,
  name: string,
  audioUrl?: string,
  documentUrl?: string,
  summary?: string,
  bulletPoints?: string[],
  transcription?: string,
  flashcards?: Flashcard[],
  quiz?: QuizQuestion[],
  isProcessing: boolean,
  isCompleted: boolean,
  duration: number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration Firebase

La configuration Firebase est incluse dans `src/config/firebase.ts` avec vos clés d'API :
- **Project ID**: studyeasy-3fb24
- **Auth Domain**: studyeasy-3fb24.firebaseapp.com
- **Storage Bucket**: studyeasy-3fb24.firebasestorage.app

## ⚡ Fonctionnalités temps réel

- **Synchronisation automatique** des données entre les écrans
- **Mises à jour instantanées** des compteurs (leçons, chapitres)
- **Persistance locale** avec récupération automatique

## 🎯 Prochaines étapes possibles

1. **IA réelle** - Remplacer les services factices par de vraies APIs
2. **Mode hors-ligne** - Synchronisation différée
3. **Partage de contenu** - Entre utilisateurs
4. **Analytics** - Suivi des progrès d'apprentissage
5. **Notifications push** - Rappels d'étude

## 🚨 Notes importantes

- Les **générations IA sont factices** comme demandé
- L'application nécessite une **connexion internet** pour fonctionner
- Les **compteurs se mettent à jour automatiquement** lors des CRUD
- Les **fichiers sont organisés** par utilisateur dans Storage

---

✅ **L'application est maintenant prête à être utilisée avec Firebase !**
