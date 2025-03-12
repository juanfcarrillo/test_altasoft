import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { useChat } from '../../../context/ChatContext';

export default function NewChat() {
  const { createChat, currentChat } = useChat();
  const router = useRouter();

  useEffect(() => {
    async function initializeNewChat() {
      await createChat();
      // After creating a new chat, redirect to its page
      if (currentChat) {
        router.replace(`/chat/${currentChat.id}`);
      }
    }

    initializeNewChat();
  }, []);

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#0284c7" />
    </View>
  );
}
