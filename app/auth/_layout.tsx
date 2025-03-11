import { Redirect, Stack } from 'expo-router';

import { useAuth } from '~/context/AuthContext';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (session && !loading) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
