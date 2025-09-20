import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import { ChatMessage } from '../types';
import { fetchChatHistory, sendChatMessage } from '../api/backend';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const { chapterId } = route.params;

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const history = await fetchChatHistory(chapterId);
        if (history.length === 0) {
          setMessages([
            {
              id: 'assistant-intro',
              role: 'assistant',
              content: "Bonjour ! Posez-moi toutes vos questions sur le cours, je suis là pour vous aider.",
              timestamp: new Date(),
            },
          ]);
        } else {
          setMessages(history);
        }
      } catch (_err) {
        setError("Impossible de charger l'historique du chat.");
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [chapterId]);

  const handleSend = async () => {
    if (inputText.trim() === '' || isSending) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    const optimisticMessages = [...messages, userMessage];
    setMessages(optimisticMessages);
    setInputText('');
    setIsSending(true);

    try {
      const updated = await sendChatMessage(chapterId, userMessage.content);
      setMessages(updated);
    } catch (_err) {
      setMessages(messages);
      setError("Impossible d'envoyer le message. Réessayez plus tard.");
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Ionicons name="sparkles" size={16} color={Colors.accent.purple} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Assistant IA</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{isSending ? 'Réponse en cours...' : 'En ligne'}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.menuButton} onPress={() => setError(null)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={[styles.loaderContainer, styles.centered]}>
            <ActivityIndicator size="large" color={Colors.accent.blue} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={Colors.accent.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Poser une question..."
            placeholderTextColor={Colors.text.tertiary}
            multiline
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (inputText.trim() === '' || isSending) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={inputText.trim() === '' || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.accent.blue} />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() === '' ? Colors.text.tertiary : Colors.accent.blue} 
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.green,
  },
  statusText: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  loaderContainer: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent.purple + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    padding: 16,
    borderRadius: 16,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: Colors.accent.blue,
    borderTopRightRadius: 4,
    marginLeft: 'auto',
  },
  assistantBubble: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 4,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 22,
  },
  userText: {
    color: Colors.surface,
  },
  assistantText: {
    color: Colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text.primary,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray[100],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.accent.red + '10',
  },
  errorText: {
    ...Typography.footnote,
    color: Colors.accent.red,
    flex: 1,
  },
});
