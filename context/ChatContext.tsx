import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, useEffect } from 'react';

import { Chat, Message } from '../src/models/chat';

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  createChat: () => Promise<void>;
  updateChatTitle: (chatId: number, newTitle: string) => Promise<void>;
  addMessage: (chatId: number, message: Message) => Promise<void>;
  setCurrentChat: (chat: Chat) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const storedChats = await AsyncStorage.getItem('chats');
      if (storedChats) {
        const parsedChats = JSON.parse(storedChats);
        setChats(parsedChats);
        if (parsedChats.length > 0) {
          setCurrentChat(parsedChats[0]);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const saveChats = async (updatedChats: Chat[]) => {
    try {
      await AsyncStorage.setItem('chats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  };

  const createChat = async () => {
    const newChat: Chat = {
      id: Date.now(),
      title: 'New Chat',
      messages: [
        {
          id: Date.now(),
          role: 'assistant',
          content: "Hello! I'm your networking AI assistant. How can I help you today?",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    setCurrentChat(newChat);
    await saveChats(updatedChats);
  };

  const updateChatTitle = async (chatId: number, newTitle: string) => {
    const updatedChats = chats.map((chat) =>
      chat.id === chatId ? { ...chat, title: newTitle, updatedAt: new Date() } : chat
    );
    setChats(updatedChats);
    if (currentChat?.id === chatId) {
      setCurrentChat({ ...currentChat, title: newTitle });
    }
    await saveChats(updatedChats);
  };

  const addMessage = async (chatId: number, message: Message) => {
    const updatedChats = chats.map((chat) => {
      if (chat.id === chatId) {
        const updatedChat = {
          ...chat,
          messages: [...chat.messages, message],
          updatedAt: new Date(),
        };
        // If this is the current chat, update it as well
        if (currentChat?.id === chatId) {
          setCurrentChat(updatedChat);
        }
        return updatedChat;
      }
      return chat;
    });

    setChats(updatedChats);
    await saveChats(updatedChats);
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        createChat,
        updateChatTitle,
        addMessage,
        setCurrentChat,
      }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (undefined === context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
