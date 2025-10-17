# Test Cases pour les Formules LaTeX dans les Flashcards

## Cas de Test

### 1. Formule Simple (Display)
**Input:**
```
\\[E = mc^2\\]
```
**Attendu:** Formule centrée E = mc²

### 2. Formule avec Fraction
**Input:**
```
\\[E_c = \\frac{1}{2}mv^2\\]
```
**Attendu:** Formule avec fraction correctement affichée

### 3. Formule avec Texte et Variables Inline
**Input:**
```
\\[F = ma\\]\\n\\nOù \\(F\\) = force (N), \\(m\\) = masse (kg), \\(a\\) = accélération (m/s²)
```
**Attendu:** 
- Formule F = ma centrée
- Texte avec variables inline en dessous

### 4. Formule Complexe
**Input:**
```
\\[\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\\]
```
**Attendu:** Intégrale avec limites et racine carrée

### 5. Texte Sans LaTeX
**Input:**
```
Quelle est la capitale de la France?
```
**Attendu:** Texte normal affiché correctement

## Problèmes Résolus

1. **WebView Clipping**: Suppression des transformations 3D complexes
2. **Hauteur Dynamique**: Calcul automatique basé sur le contenu
3. **Largeur Complète**: Utilisation de toute la largeur disponible
4. **Échappement Correct**: Double échappement pour JavaScript dans HTML

## Configuration Actuelle

- **Taille de police LaTeX**: 1.1x la taille normale
- **Marges display**: 15px haut/bas
- **Padding body**: 15px
- **Hauteur minimale**: 150px (display), 100px (inline)

## Debug

Si les formules ne s'affichent toujours pas correctement:

1. Vérifier la console pour les erreurs JavaScript
2. Tester avec des formules simples d'abord
3. Vérifier que react-native-webview est correctement installé
4. S'assurer que le backend envoie les bons caractères d'échappement
