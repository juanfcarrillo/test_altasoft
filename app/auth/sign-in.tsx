import { makeRedirectUri } from 'expo-auth-session';
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, Platform } from 'react-native';

import { supabase } from '../../utils/supabase';

const redirectTo = makeRedirectUri();

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
}

function ConfirmationModal({ isVisible, onClose }: ConfirmationModalProps) {
  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 flex items-center justify-center bg-black/50">
      <View className="m-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <Text className="text-lg font-semibold text-gray-800">Check Your Email</Text>
        <Text className="mt-2 text-gray-600">
          We've sent you a magic link to sign in. Please check your email inbox.
        </Text>
        <View className="mt-6 flex-row justify-end">
          <TouchableOpacity onPress={onClose} className="rounded-lg bg-sky-500 px-4 py-2">
            <Text className="font-medium text-white">OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSignIn = async () => {
    if (!email) return;

    setLoading(true);

    const redirectUri = new URL(
      Platform.OS === 'web' ? redirectTo : process.env.EXPO_PUBLIC_WEBSITE_URL!
    );
    redirectUri.pathname = '/auth/verify';

    try {
      const { error } = await supabase.functions.invoke('create_magic_link', {
        body: {
          email,
          redirectTo: redirectUri.toString(),
          deepLinkUrl: Platform.OS !== 'web' ? redirectTo + '/auth/verify' : undefined,
        },
        headers: {
          Authorization: '',
        },
      });

      if (error) throw error;
      setShowModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center p-4">
      <View className="rounded-lg bg-white p-6 shadow-sm">
        <Text className="mb-4 text-2xl font-bold text-gray-800">Welcome</Text>
        <TextInput
          className="mb-4 rounded-lg bg-gray-100 px-4 py-2"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity
          className={`rounded-lg p-3 ${loading ? 'bg-gray-400' : 'bg-sky-500'}`}
          onPress={handleSignIn}
          disabled={loading}>
          <Text className="text-center text-white">
            {loading ? 'Sending...' : 'Sign In with Magic Link'}
          </Text>
        </TouchableOpacity>
      </View>
      <ConfirmationModal isVisible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
}
