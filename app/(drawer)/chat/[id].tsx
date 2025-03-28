import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useChat } from '../../../context/ChatContext';

import { EditTitleModal } from '~/components/EditTitleModalProps';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { currentChat, updateChatTitle, addMessage, setCurrentChat, chats } = useChat();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [editTitleModal, setEditTitleModal] = useState(false);
  const isFetching = useRef(false);

  const handleEditTitle = () => {
    if (!currentChat) return;
    setEditTitleModal(true);
  };

  const handleConfirmTitleEdit = (newTitle: string) => {
    if (currentChat && newTitle.trim()) {
      updateChatTitle(currentChat.id, newTitle.trim());
    }
    setEditTitleModal(false);
  };

  // Set the current chat based on the route parameter
  useEffect(() => {
    const chatId = Number(id);
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  }, [id, chats]);

  const handleSend = async () => {
    if (!message.trim() || !currentChat) return;

    const currentMessage = message.trim();
    setMessage('');

    try {
      const userMessage = {
        id: Date.now(),
        role: 'user' as const,
        content: currentMessage,
        timestamp: new Date(),
      };
      await addMessage(currentChat.id, userMessage);
      setIsLoading(true);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setIsLoading(false);
    }
  };

  async function makeApiCall() {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'insomnia/10.3.1',
        },
        body: JSON.stringify({
          session_id: String(currentChat!.id),
          message: currentChat!.messages.at(-1)?.content || '',
        }),
      };

      const response = await fetch(`${process.env.EXPO_PUBLIC_N8N_URL}/webhook/chat`, options);

      const data = await response.json();

      const aiMessage = {
        id: Date.now(),
        role: 'assistant' as const,
        content: data[0].output,
        timestamp: new Date(),
      };

      await addMessage(currentChat!.id, aiMessage);
    } catch (error) {
      console.error('Error generating AI response:', error);
      Alert.alert('Error', 'Failed to generate AI response');
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }

  useEffect(() => {
    if (currentChat?.messages.at(-1)?.role === 'user') {
      makeApiCall();
    }
  }, [currentChat?.messages]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [currentChat?.messages]);

  if (!currentChat) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1">
      <Stack.Screen
        options={{
          title: currentChat.title,
          headerRight: () => (
            <TouchableOpacity className="mr-4" onPress={handleEditTitle}>
              <MaterialIcons name="edit" size={20} color="#0284c7" />
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-gray-50">
        <ScrollView ref={scrollViewRef} className="flex-1 p-4">
          {currentChat.messages.map((msg) => (
            <View
              key={msg.id}
              className={`mb-4 max-w-[80%] rounded-lg border border-gray-200 bg-white p-3 ${msg.role === 'user' && 'ml-auto'}`}>
              <Text className="text-gray-800">{msg.content}</Text>
              {msg.codeSnippet && (
                <View className="mt-2 rounded-md bg-gray-800 p-3">
                  <Text className="font-mono text-white">{msg.codeSnippet}</Text>
                </View>
              )}
              {msg.links && msg.links.length > 0 && (
                <View className="mt-2">
                  {msg.links.map((link, index) => (
                    <Text key={index} className="text-sky-600 underline">
                      {link}
                    </Text>
                  ))}
                </View>
              )}
              <Text className="mt-1 text-right text-xs text-gray-500">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))}
          {isLoading && (
            <View className="flex-row items-center p-3">
              <ActivityIndicator color="#0284c7" />
              <Text className="ml-2 text-gray-600">Processing your request...</Text>
            </View>
          )}
        </ScrollView>

        <View className="border-t border-gray-200 bg-white p-4">
          <View className="flex-row items-center space-x-2">
            <TextInput
              className="flex-1 rounded-full bg-gray-100 px-4 py-2"
              placeholder="Ask about networking..."
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={isLoading || !message.trim()}
              className={`rounded-full p-2 ${
                isLoading || !message.trim() ? 'bg-gray-300' : 'bg-sky-500'
              }`}>
              <MaterialIcons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <EditTitleModal
        isVisible={editTitleModal}
        onClose={() => setEditTitleModal(false)}
        onConfirm={handleConfirmTitleEdit}
        currentTitle={currentChat.title}
      />
    </KeyboardAvoidingView>
  );
}
