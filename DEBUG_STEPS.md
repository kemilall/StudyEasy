# 🔍 Étapes de Debug pour les Formules LaTeX

## Problème
Les formules LaTeX ne s'affichent pas dans les WebView, mais le texte normal est visible.

## Solutions Implémentées

### 1. **MathText.tsx** (Version Actuelle)
- Rend tout le contenu dans un seul WebView si LaTeX détecté
- Utilise KaTeX auto-render
- Ajuste la hauteur dynamiquement
- Affiche un indicateur de chargement

### 2. **MathTextDebug.tsx** (Pour Tester)
Un composant de debug qui affiche:
- Le contenu brut de la flashcard
- Un WebView simple pour vérifier qu'il fonctionne

## 🧪 Test Rapide

Pour tester si le WebView fonctionne, remplacez temporairement dans FlashcardsScreen:

```tsx
// Remplacer
import { MathText } from '../components/MathText';

// Par
import { MathTextDebug as MathText } from '../components/MathTextDebug';
```

Cela affichera:
- Un cadre rouge avec "DEBUG MODE"
- Le contenu brut de la flashcard
- Un fond gris si le WebView fonctionne

## 📋 Checklist de Debug

1. **Le WebView s'affiche-t-il?**
   - ✅ OUI → Le problème vient du rendu LaTeX
   - ❌ NON → Problème avec react-native-webview

2. **Le contenu brut contient-il des `\[` ou `\(`?**
   - ✅ OUI → Les formules sont là
   - ❌ NON → Problème côté backend

3. **Y a-t-il des erreurs dans la console?**
   - Vérifiez Metro bundler
   - Vérifiez Xcode/Android Studio

## 🛠 Solutions Possibles

### Si WebView ne s'affiche pas:
```bash
# iOS
cd ios && pod install
npm run ios

# Android
cd android && ./gradlew clean
npm run android
```

### Si les formules sont mal formatées:
Vérifiez que le backend envoie:
- `\\[formula\\]` (avec doubles backslashes)
- PAS `\[formula\]` (simples backslashes)

### Test avec contenu statique:
Dans FlashcardsScreen, testez avec:
```tsx
const testCard = {
  question: "Test",
  answer: "Formula: \\[E = mc^2\\]"
};
// Utilisez testCard au lieu de currentCard
```

## 📱 Platform Specific

### iOS
- Assurez-vous que JavaScript est activé
- Vérifiez les logs Xcode

### Android
- Essayez `androidLayerType="software"`
- Vérifiez adb logcat

## 🚀 Prochaines Étapes

1. Testez avec MathTextDebug
2. Notez ce qui s'affiche/ne s'affiche pas
3. Vérifiez les logs console
4. Partagez les résultats pour qu'on puisse ajuster
