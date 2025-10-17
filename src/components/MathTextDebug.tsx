import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { WebView } from 'react-native-webview';

interface MathTextProps {
  children: string;
  fontSize?: number;
  lineHeight?: number;
  style?: TextStyle;
}

export const MathTextDebug: React.FC<MathTextProps> = ({ 
  children, 
  fontSize = 16, 
  lineHeight,
  style 
}) => {
  // Log pour debug
  console.log('[MathTextDebug] Raw content:', children);
  
  // Check if content contains LaTeX
  const hasLatex = children.includes('\\[') || children.includes('\\(');
  console.log('[MathTextDebug] Has LaTeX:', hasLatex);
  
  // If no LaTeX, render as plain text
  if (!hasLatex) {
    return (
      <Text style={[styles.plainText, { fontSize, lineHeight: lineHeight || fontSize * 1.4 }, style]}>
        {children.replace(/\\n/g, '\n')}
      </Text>
    );
  }

  // Test avec HTML statique d'abord
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          background: #f0f0f0;
          padding: 20px;
          text-align: center;
          font-size: 18px;
        }
      </style>
    </head>
    <body>
      <h3>WebView fonctionne!</h3>
      <p>Contenu brut:</p>
      <pre style="text-align: left; background: white; padding: 10px; overflow: auto;">
${children.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </pre>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.debugText}>DEBUG MODE - WebView Test:</Text>
      <View style={styles.webViewContainer}>
        <WebView
          source={{ html: testHtml }}
          style={styles.webView}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          onError={(e) => console.log('[MathTextDebug] WebView error:', e)}
          onHttpError={(e) => console.log('[MathTextDebug] HTTP error:', e)}
          onLoadEnd={() => console.log('[MathTextDebug] WebView loaded')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  plainText: {
    textAlign: 'center',
  },
  debugText: {
    fontSize: 14,
    color: 'red',
    marginBottom: 5,
  },
  webViewContainer: {
    height: 200,
    borderWidth: 2,
    borderColor: 'red',
  },
  webView: {
    backgroundColor: 'white',
    width: '100%',
    height: '100%',
  },
});
