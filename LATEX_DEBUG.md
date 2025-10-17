# Guide de Debug pour les Formules LaTeX

## 🔍 Points à Vérifier

### 1. **Vérifier le Contenu des Flashcards**
Dans la console React Native, ajoutez ce log dans FlashcardsScreen:
```javascript
console.log('Question:', currentCard.question);
console.log('Answer:', currentCard.answer);
```

### 2. **Format Attendu du Backend**
Les formules doivent arriver avec des doubles backslashes:
- Display: `\\[E = mc^2\\]`
- Inline: `\\(m\\) = masse`

### 3. **Test Simple**
Créez une flashcard de test avec:
```json
{
  "question": "Test formule",
  "answer": "\\[x^2 + y^2 = z^2\\]"
}
```

### 4. **Vérifier WebView**
Si rien ne s'affiche:
1. Vérifiez que `react-native-webview` est bien lié:
   ```bash
   cd ios && pod install
   ```
2. Reconstruisez l'app

### 5. **Console WebView**
Le HTML inclut des logs. Vérifiez la console Xcode/Android Studio pour:
- Erreurs JavaScript
- Erreurs de chargement KaTeX

## 🛠 Solution Actuelle

Le nouveau `MathText`:
1. Détecte automatiquement les formules LaTeX
2. Rend tout dans un seul WebView si LaTeX présent
3. Utilise auto-render de KaTeX
4. Ajuste la hauteur dynamiquement

## 📊 Exemples de Test

### Test 1: Formule Simple
```
\\[E = mc^2\\]
```

### Test 2: Formule avec Texte
```
La formule \\[F = ma\\]\\n\\nOù \\(F\\) est la force
```

### Test 3: Sans LaTeX
```
Quelle est la capitale de la France?
```

## 🚨 Si Rien Ne Marche

1. **Vérifiez les Permissions**
   - JavaScript activé dans WebView
   - Internet pour charger KaTeX CDN

2. **Test Direct**
   Remplacez temporairement le contenu par:
   ```javascript
   const testContent = "Test: \\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]";
   ```

3. **Mode Debug**
   Dans MathText, ajoutez:
   ```javascript
   console.log('Raw content:', children);
   console.log('Has LaTeX:', hasLatex);
   ```

## 📱 Platform-Specific

### iOS
- Assurez-vous que WebView n'est pas bloqué par des règles de sécurité
- Vérifiez Info.plist pour les permissions réseau

### Android
- `androidLayerType="hardware"` peut causer des problèmes sur certains appareils
- Essayez `"software"` si les formules ne s'affichent pas
