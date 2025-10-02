# Correctif du Timer d'Enregistrement

## Problème identifié

Lorsque l'utilisateur quittait l'écran d'enregistrement et revenait :
- ❌ Le timer ne se mettait plus à jour
- ❌ L'enregistrement semblait continuer mais ne pouvait plus être arrêté
- ❌ Le temps écoulé n'était pas correctement calculé

## Solution implémentée

### 1. Timer centralisé dans le contexte

**Avant :** Le timer était géré localement dans `RecordingStudioScreen` avec un `setInterval` qui s'arrêtait quand on quittait l'écran.

**Après :** Le timer est maintenant géré globalement dans `RecordingContext` :
```typescript
// Timer management dans RecordingContext
useEffect(() => {
  if (isRecording && currentSession) {
    const baseTime = pausedDurationRef.current;
    const startTime = Date.now();
    
    timerInterval.current = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev) return null;
        const now = Date.now();
        const elapsed = now - startTime + baseTime;
        return {
          ...prev,
          durationMillis: elapsed
        };
      });
    }, 100);
  }
}, [isRecording]);
```

### 2. Gestion correcte de la pause/reprise

**Système de pause amélioré :**
- `pausedDurationRef` : Sauvegarde la durée totale au moment de la pause
- Lors de la reprise, le timer reprend en ajoutant le temps déjà écoulé
- Le calcul : `elapsed = (now - startTime) + baseTime`

### 3. Variables globales pour l'enregistrement

**Dans `RecordingStudioScreen` :**
```typescript
// Global recording state to persist across navigation
let globalRecording: Audio.Recording | null = null;
let globalLessonId: string | null = null;
```

Ces variables permettent de :
- Conserver l'objet Audio.Recording même quand on navigue
- Restaurer l'enregistrement quand on revient sur l'écran
- Continuer l'enregistrement en arrière-plan

### 4. Restauration de l'état au retour

**Dans `useFocusEffect` :**
```typescript
useFocusEffect(
  React.useCallback(() => {
    setIsOnRecordingScreen(true);
    
    // Restore from global state if exists
    if (globalRecording && currentSession) {
      setRecording(globalRecording);
      setLessonId(currentSession.lessonId);
      setIsRecording(contextIsRecording);
      setIsPaused(contextIsPaused);
      lessonNameRef.current = currentSession.lessonName;
      setIsInitialized(true);
    }
    
    return () => {
      setIsOnRecordingScreen(false);
    };
  }, [])
);
```

## Flux de fonctionnement

### 1. Démarrer l'enregistrement
- Création de l'objet `Audio.Recording`
- Stockage dans `globalRecording`
- Démarrage du timer dans le contexte
- Initialisation de `pausedDurationRef` à 0

### 2. Quitter l'écran pendant l'enregistrement
- L'enregistrement continue (objet Audio conservé)
- Le timer continue dans le contexte
- La bulle flottante apparaît

### 3. Revenir sur l'écran
- Restauration depuis `globalRecording`
- L'état est synchronisé avec le contexte
- Le timer affiche la durée mise à jour
- Tous les contrôles fonctionnent

### 4. Pause et reprise
- **Pause** : Sauvegarde de `durationMillis` dans `pausedDurationRef`
- **Reprise** : Le timer reprend en tenant compte du temps déjà écoulé

### 5. Validation
- Arrêt de l'enregistrement
- Upload du fichier
- Nettoyage des variables globales
- Reset du timer

## Avantages de cette solution

1. ✅ **Timer toujours actif** : Continue même hors de l'écran
2. ✅ **Calcul précis** : Basé sur l'horloge système, pas sur des incréments
3. ✅ **État global cohérent** : Synchronisation entre contexte et écran
4. ✅ **Gestion de la pause** : Le temps en pause n'est pas compté
5. ✅ **Navigation fluide** : L'utilisateur peut naviguer librement

## Tests recommandés

1. ✅ Démarrer un enregistrement → quitter → revenir → vérifier que le timer continue
2. ✅ Pause → attendre → reprendre → vérifier que le temps de pause n'est pas compté
3. ✅ Enregistrer 30s → quitter → attendre 10s → revenir → timer doit afficher ~40s
4. ✅ Valider après navigation → vérifier la durée totale correcte

## Notes techniques

- Le timer se met à jour toutes les 100ms pour une fluidité visuelle
- L'objet Audio.Recording reste actif même quand l'app est en arrière-plan (iOS/Android)
- Les variables globales sont nettoyées après validation ou suppression
- Le contexte est la source de vérité pour l'état d'enregistrement
