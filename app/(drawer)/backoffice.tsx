import { makeRedirectUri } from 'expo-auth-session';
import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';

import { supabase } from '../../utils/supabase';
const redirectTo = makeRedirectUri();

interface MagicLink {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'used';
}

export default function Backoffice() {
  const [email, setEmail] = useState('');
  const [magicLinks, setMagicLinks] = useState<MagicLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMagicLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('magic_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMagicLinks(data || []);
    } catch (error) {
      console.error('Error fetching magic links:', error);
      Alert.alert('Error', 'Failed to fetch magic links');
    }
  };

  useEffect(() => {
    fetchMagicLinks();
  }, []);

  const generateMagicLink = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      // const { data, error } = await supabase.auth.signInWithOtp({
      //   email: email.trim(),
      //   options: {
      //     emailRedirectTo: redirectTo + '/auth/verify',
      //   },
      // });

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo + '/auth/verify',
        },
      });

      if (error) throw error;

      // Store the magic link information
      const { error: dbError } = await supabase.from('magic_links').insert({
        email: email.trim(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        status: 'pending',
      });

      if (dbError) throw dbError;

      Alert.alert('Success', 'Magic link generated and sent successfully');
      setEmail('');
      fetchMagicLinks();
    } catch (error: any) {
      console.error('Error generating magic link:', error);
      Alert.alert('Error', error.message || 'Failed to generate magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Magic Link Generator',
        }}
      />

      <View className="p-4">
        <View className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-2 text-lg font-semibold text-gray-800">Generate Magic Link</Text>
          <View className="flex-row space-x-2">
            <TextInput
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2"
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={generateMagicLink}
              disabled={isLoading}
              className={`rounded-lg px-4 py-2 ${isLoading ? 'bg-gray-300' : 'bg-sky-500'}`}>
              <Text className="text-white">{isLoading ? 'Sending...' : 'Send Link'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="mb-4 text-lg font-semibold text-gray-800">Recent Magic Links</Text>
        <ScrollView>
          {magicLinks.map((link) => (
            <View key={link.id} className="mb-4 rounded-lg bg-white p-4 shadow-sm">
              <Text className="text-gray-800">Email: {link.email}</Text>
              <Text className="text-sm text-gray-600">Status: {link.status}</Text>
              <Text className="text-sm text-gray-600">
                Created: {new Date(link.created_at).toLocaleDateString()}
              </Text>
              <Text className="text-sm text-gray-600">
                Expires: {new Date(link.expires_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
