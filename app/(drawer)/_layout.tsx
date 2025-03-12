import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Link, Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';

import { HeaderButton } from '../../components/HeaderButton';
import { useAuth } from '../../context/AuthContext';

import SignOutButton from '~/components/SignOutButton';

const DrawerLayout = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth/verify" />;
  }

  function CustomDrawerContent(props: any) {
    return (
      <View className="flex-1">
        {/* User info section */}
        <View className="border-b border-gray-200 p-4">
          <Text className="text-lg font-semibold text-gray-800">{session?.user.email}</Text>
        </View>

        {/* Drawer items */}
        <DrawerContentScrollView {...props}>
          <DrawerItemList {...props} />
        </DrawerContentScrollView>

        {/* Sign out button at bottom */}
        <View className="border-t border-gray-200">
          <Link href="/backoffice" asChild>
            <Pressable className="flex-row items-center p-4">
              <MaterialIcons name="settings" size={24} color="#64748B" />
              <Text className="ml-3 text-gray-600">Manage Invitations</Text>
            </Pressable>
          </Link>
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
    </Drawer>
  );
};

export default DrawerLayout;
