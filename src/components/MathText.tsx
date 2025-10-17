import React, { useState } from 'react';
import { View, Text, StyleSheet, TextStyle, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface MathTextProps {
  children: string;
  fontSize?: number;
  lineHeight?: number;
  style?: TextStyle;
}

export const MathText: React.FC<MathTextProps> = ({ 
  children, 
  fontSize = 16, 
  lineHeight,
  style 
}) => {
  const [loading, setLoading] = useState(true);
  const [height, setHeight] = useState(150);

  // Check if content contains LaTeX
  const hasLatex = children.includes('\\[') || children.includes('\\(');
  
  // If no LaTeX, render as plain text
  if (!hasLatex) {
    return (
      <Text style={[styles.plainText, { fontSize, lineHeight: lineHeight || fontSize * 1.4 }, style]}>
        {children.replace(/\\n/g, '\n')}
      </Text>
    );
  }

  // For LaTeX content, render everything in a single WebView
  const textColor = String(style?.color || '#1a1a1a');
  
  // Prepare content - handle newlines properly
  const preparedContent = children
    .replace(/\\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/><br/>');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent;
    }
    body {
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${fontSize}px;
      color: ${textColor};
      line-height: ${lineHeight || fontSize * 1.4}px;
      text-align: center;
    }
    .katex-display {
      margin: 15px 0;
    }
    .katex {
      font-size: 1.2em;
    }
    .error {
      color: red;
      font-size: 14px;
      padding: 10px;
      background: #fee;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div id="content">${preparedContent}</div>
  <script>
    function sendHeight() {
      const height = document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({ 
        type: 'setHeight', 
        height: height 
      }));
    }
    
    document.addEventListener('DOMContentLoaded', function() {
      try {
        renderMathInElement(document.getElementById('content'), {
          delimiters: [
            {left: '\\\\[', right: '\\\\]', display: true},
            {left: '\\\\(', right: '\\\\)', display: false}
          ],
          throwOnError: false,
          errorColor: '#cc0000',
          trust: true
        });
        
        // Send height after rendering
        setTimeout(sendHeight, 100);
        
        // Debug - show what we're trying to render
        console.log('Content:', document.getElementById('content').innerHTML);
        
      } catch (e) {
        document.getElementById('content').innerHTML = 
          '<div class="error">Error: ' + e.message + '</div>';
        sendHeight();
      }
    });
    
    window.onerror = function(msg, url, line) {
      document.getElementById('content').innerHTML = 
        '<div class="error">JS Error: ' + msg + '</div>';
      sendHeight();
      return true;
    };
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={[styles.loadingContainer, { height }]}>
          <ActivityIndicator size="small" color={textColor} />
        </View>
      )}
      <WebView
        source={{ html }}
        style={[styles.webView, { height, opacity: loading ? 0 : 1 }]}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        onLoadEnd={() => setLoading(false)}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'setHeight' && data.height) {
              setHeight(Math.min(data.height + 20, 400)); // Max 400px
            }
          } catch (e) {
            console.warn('WebView message error:', e);
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setLoading(false);
        }}
      />
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
  webView: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});