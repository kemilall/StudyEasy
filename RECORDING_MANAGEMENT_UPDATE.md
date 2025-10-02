# Mise à jour de la gestion d'enregistrement

## Vue d'ensemble

Cette mise à jour implémente un nouveau système de gestion d'enregistrement conforme aux exigences suivantes :

1. ✅ **Plus de drafts** - Suppression complète du système de brouillons
2. ✅ **Bulle flottante** - Affichage d'une bulle persistante pendant l'enregistrement permettant de revenir à l'écran d'enregistrement
3. ✅ **Blocage en pause** - L'utilisateur est bloqué sur l'écran en pause avec options : reprendre, valider ou quitter
4. ✅ **Warning de suppression** - Un popup avertit que quitter supprimera l'enregistrement
5. ✅ **Support arrière-plan** - L'enregistrement continue en arrière-plan et peut être repris

## Changements effectués

### 1. RecordingContext (`src/contexts/RecordingContext.tsx`)

**Avant :**
- Gérait des drafts avec AsyncStorage
- Interface complexe avec plusieurs états de draft

**Après :**
- Contexte simplifié gérant une session d'enregistrement active
- États clairs : `isRecording`, `isPaused`, `currentSession`
- Méthode `isOnRecordingScreen` pour savoir si on est sur l'écran d'enregistrement
- Pas de persistance de drafts

**Interface :**
```typescript
interface RecordingSession {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  lessonId: string;
  lessonName: string;
  durationMillis: number;
}

interface RecordingContextType {
  isRecording: boolean;
  isPaused: boolean;
  currentSession: RecordingSession | null;
  isOnRecordingScreen: boolean;
  startRecordingSession: (session: RecordingSession) => void;
  pauseRecordingSession: () => void;
  resumeRecordingSession: () => void;
  stopRecordingSession: () => void;
  deleteRecordingSession: () => void;
  setIsOnRecordingScreen: (value: boolean) => void;
  updateSessionDuration: (durationMillis: number) => void;
}
```

### 2. FloatingRecordingBubble (`src/components/FloatingRecordingBubble.tsx`)

**Nouveau composant** qui affiche :
- Une bulle flottante en bas à droite de l'écran
- Visible uniquement quand il y a une session active ET qu'on n'est pas sur l'écran d'enregistrement
- Affiche le nom de la leçon et la durée
- Animation de pulsation pendant l'enregistrement
- Couleur différente selon l'état (rouge = enregistrement, orange = pause)
- Cliquer revient à l'écran d'enregistrement

### 3. RecordingStudioScreen (`src/screens/RecordingStudioScreen.tsx`)

**Changements majeurs :**

1. **Gestion de session** :
   - Crée et démarre une session au début de l'enregistrement
   - Met à jour le contexte global avec la durée
   - Marque quand on est sur l'écran (`setIsOnRecordingScreen`)

2. **Comportement en pause** :
   - Affiche 3 boutons : Reprendre, Valider, Quitter
   - Le bouton "Quitter" affiche un modal de confirmation
   - L'utilisateur est "bloqué" sur l'écran (ne peut pas naviguer avec le back)

3. **Comportement du back** :
   - En enregistrement : permet de quitter (la bulle apparaît)
   - En pause : affiche le modal de confirmation
   - Sans enregistrement : navigation normale

4. **Gestion arrière-plan** :
   - Met en pause l'enregistrement quand l'app va en arrière-plan
   - Reprend automatiquement au retour si c'était en cours

5. **Suppression** :
   - Supprime la leçon créée si on quitte en pause
   - Nettoie complètement la session

### 4. DoubleConfirmationModal (`src/components/DoubleConfirmationModal.tsx`)

**Améliorations :**
- Support des confirmations simples (sans double confirmation)
- Prop `isDangerous` pour changer la couleur du bouton
- Prop `warningMessage` optionnelle

### 5. AppNavigator (`src/navigation/AppNavigator.tsx`)

**Changements :**
- Suppression de l'import `DraftsScreen`
- Suppression de la route `Drafts`
- Ajout du composant `<FloatingRecordingBubble />` dans `AppStack`

### 6. Suppression de fichiers

Fichiers supprimés :
- ✅ `src/screens/DraftsScreen.tsx`
- ✅ `src/components/RecordingExitModal.tsx`
- ✅ `src/hooks/useRecordingNavigation.tsx`

### 7. Types (`src/types/index.ts`)

**Supprimé :**
- Interface `RecordingDraft`
- Interface `RecordingSegment`

**Conservation :**
- Le status `'draft'` pour les leçons (utilisé pendant le traitement)

### 8. DataService (`src/services/dataService.ts`)

**Supprimé :**
- Méthode `saveRecordingDraft`
- Méthode `subscribeToRecordingDrafts`
- Méthode `deleteRecordingDraft`
- Import `setDoc`
- Import `RecordingDraft`

### 9. Navigation types (`src/navigation/types.ts`)

**Supprimé :**
- Route `Drafts: undefined`
- Paramètre `draftId` de `RecordingStudio`

### 10. RecordingSubjectPickerScreen (`src/screens/RecordingSubjectPickerScreen.tsx`)

**Changements :**
- Suppression du bouton "Brouillons" dans le header
- Suppression de l'import `useRecording`
- Suppression de l'appel à `startRecording` (maintenant géré dans RecordingStudioScreen)

## Flux d'utilisation

### Démarrer un enregistrement

1. User clique sur "Nouvel enregistrement"
2. Sélectionne matière et nom de leçon
3. Navigue vers `RecordingStudioScreen`
4. Clique sur le bouton mic pour démarrer
5. Une leçon est créée en base avec status `'draft'`
6. Session démarre dans le contexte

### Pendant l'enregistrement

- Timer continue
- User peut quitter l'écran → bulle flottante apparaît
- Cliquer sur la bulle → retour à l'écran
- L'enregistrement continue même en arrière-plan

### Mettre en pause

1. User clique sur pause
2. Affichage de 3 options : Reprendre / Valider / Quitter
3. User est bloqué sur l'écran
4. Si quitter → modal de confirmation → suppression

### Valider l'enregistrement

1. User clique sur "Valider"
2. L'enregistrement est finalisé
3. Upload vers Firebase Storage
4. Navigation vers `ProcessingScreen`
5. Session supprimée du contexte

### Quitter (en pause)

1. User clique sur "Quitter et supprimer"
2. Modal de confirmation s'affiche
3. Si confirmé :
   - Arrêt de l'enregistrement
   - Suppression de la leçon
   - Suppression de la session
   - Retour à l'écran précédent

## Comportement arrière-plan

L'app gère correctement les transitions app actif ↔ arrière-plan :

- **Actif → Arrière-plan** : Met en pause l'enregistrement technique (pour économiser batterie)
- **Arrière-plan → Actif** : Reprend l'enregistrement si c'était en cours
- La session reste active et la bulle reste visible

## Tests recommandés

1. ✅ Démarrer un enregistrement et naviguer dans l'app → bulle visible
2. ✅ Cliquer sur la bulle → retour à l'écran
3. ✅ Mettre en pause → 3 boutons affichés
4. ✅ Essayer de naviguer en pause → impossible (sauf via le modal)
5. ✅ Quitter en pause → modal de confirmation
6. ✅ Confirmer la suppression → enregistrement supprimé
7. ✅ Mettre l'app en arrière-plan pendant enregistrement → reprend au retour
8. ✅ Valider un enregistrement → upload et navigation vers processing

## Migration

Pour les utilisateurs existants avec des drafts :
- Les anciens drafts en Firebase resteront mais ne seront plus accessibles
- Aucune migration nécessaire (les drafts étaient déjà marqués comme éphémères)
- Les leçons existantes ne sont pas affectées
