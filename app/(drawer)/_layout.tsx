import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Link, Redirect, useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { View, ActivityIndicator, Text, Pressable, ScrollView } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

import SignOutButton from '~/components/SignOutButton';
import { useUser } from '~/hooks/useUser';

const DrawerLayout = () => {
  const { session, loading } = useAuth();
  const { chats, currentChat, createChat } = useChat();
  const { user } = useUser();
  const router = useRouter();

  const handleNewChat = async () => {
    const chatId = await createChat();
    if (chatId) {
      router.push(`/chat/${chatId}`);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth/sign-in" />;
  }

  function CustomDrawerContent(props: any) {
    return (
      <View className="flex-1">
        {/* User info section */}
        <View className="border-b border-gray-200 p-4">
          <Text className="text-lg font-semibold text-gray-800">{session?.user.email}</Text>
        </View>

        <View className="flex-1 border-b border-gray-200">
          <View className="flex-row items-center justify-between p-4">
            <Text className="text-sm font-medium text-gray-600">Recent Chats</Text>
            <Pressable className="rounded-md bg-[#38BDF8] px-3 py-1" onPress={handleNewChat}>
              <Text className="text-sm text-white">New Chat</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1">
            {chats.map((chat) => (
              <Link key={chat.id} href={`/chat/${chat.id}`} asChild>
                <Pressable className="rounded-md px-3 py-1">
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    color={currentChat?.id === chat.id ? '#38BDF8' : '#64748B'}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-800">{chat.title}</Text>
                    <Text className="text-sm text-gray-500" numberOfLines={1}>
                      {chat.messages[chat.messages.length - 1]?.content.substring(0, 30)}...
                    </Text>
                  </View>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        </View>

        {/* Sign out button at bottom */}
        <View className="border-t border-gray-200">
          <Link href="/backoffice" asChild>
            <Pressable className="flex-row items-center p-4">
              <MaterialIcons name="settings" size={24} color="#64748B" />
              <Text className="ml-3 text-gray-600">Manage Invitations</Text>
            </Pressable>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/documents" asChild>
              <Pressable className="flex-row items-center p-4">
                <MaterialIcons name="file-upload" size={24} color="#64748B" />
                <Text className="ml-3 text-gray-600">Manage Documents</Text>
              </Pressable>
            </Link>
          )}
          <SignOutButton />
        </View>
      </View>
    );
  }

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerTintColor: '#0284c7',
        drawerActiveTintColor: '#0284c7',
      }}>
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: 'Home',
          drawerLabel: 'Home',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="chat/[id]"
        options={{
          headerTitle: 'Chat',
          drawerItemStyle: { display: 'none' }, // Hide from drawer
        }}
      />
      <Drawer.Screen
        name="backoffice"
        options={{
          headerTitle: 'Manage Invitations',
          drawerLabel: 'Manage Invitations',
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="documents"
        options={{
          headerTitle: 'Manage Documents',
          drawerLabel: 'Manage Documents',
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="file-upload" size={size} color={color} />
          ),
          drawerItemStyle: {
            display: session?.user.role === 'admin' ? 'flex' : 'none',
          },
        }}
      />
    </Drawer>
  );
};

export default DrawerLayout;
