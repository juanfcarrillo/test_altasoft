import { useRouter, useGlobalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

import { supabase } from '../../utils/supabase';

export default function VerifyOTP() {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenHash, setTokenHash] = useState('');
  const [email, setEmail] = useState('');

  const verifyOTP = async () => {
    if (!tokenHash || !email) {
      Alert.alert('Error', 'Missing token or email');
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'email',
      });

      if (error) throw error;

      if (session) {
        const { error: updateError } = await supabase
          .from('invitations')
          .update({
            status: 'active',
            user_id: session.user.id,
          })
          .eq('email', email)
          .eq('status', 'pending');

        if (updateError) throw updateError;

        router.replace('/');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.email) {
      setEmail(params.email as string);
    }
    if (params.token_hash) {
      setTokenHash(params.token_hash as string);
    }

    if (params.deeplink_url) {
      window.location.href = params.deeplink_url as string;
    }
  }, [params]);

  useEffect(() => {
    if (tokenHash) {
      verifyOTP();
    }
  }, [tokenHash, email]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="mt-4 text-gray-600">Verifying your login...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="rounded-lg bg-white p-6 shadow-sm">
        <Text className="mb-4 text-lg font-semibold text-gray-800">Verify Login</Text>

        <TextInput
          className="mb-6 rounded-lg bg-gray-100 px-4 py-2"
          placeholder="Token"
          value={tokenHash}
          onChangeText={setTokenHash}
          autoCapitalize="none"
          editable={!isLoading}
        />

        <TouchableOpacity
          onPress={verifyOTP}
          disabled={isLoading || !tokenHash}
          className={`rounded-lg p-3 ${isLoading || !tokenHash ? 'bg-gray-300' : 'bg-sky-500'}`}>
          <Text className="text-center text-white">
            {isLoading ? 'Verifying...' : 'Verify Token'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
