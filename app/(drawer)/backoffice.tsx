import { makeRedirectUri } from 'expo-auth-session';
import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { useUser } from '../../hooks/useUser';
import { supabase } from '../../utils/supabase';

const redirectTo = makeRedirectUri();

interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'active';
  created_at: string;
  user_id: string | null;
  user: {
    email: string;
    role: 'admin' | 'user';
  } | null;
}

export default function Backoffice() {
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Fetch invitations
  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(
          `
          *,
          user:user_id (
            email,
            role
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      Alert.alert('Error', 'Failed to fetch invitations');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchInvitations();

    // Subscribe to changes
    const channel = supabase
      .channel('invitations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitations' }, () =>
        fetchInvitations()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const sendInvitation = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      const { error: inviteError } = await supabase.from('invitations').insert({
        email: email.trim(),
        invited_by: user?.id,
      });

      if (inviteError) throw inviteError;

      Alert.alert('Success', 'Invitation sent successfully');
      setEmail('');
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Only allow admins to access this page
  if (user?.role !== 'admin') {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-lg text-gray-800">You don't have permission to access this page</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Manage Invitations',
        }}
      />

      <View className="p-4">
        <View className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-2 text-lg font-semibold text-gray-800">Send Invitation</Text>
          <View className="flex-row space-x-2">
            <TextInput
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2"
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={sendInvitation}
              disabled={isLoading}
              className={`rounded-lg px-4 py-2 ${isLoading ? 'bg-gray-300' : 'bg-sky-500'}`}>
              <Text className="text-white">{isLoading ? 'Sending...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="mb-4 text-lg font-semibold text-gray-800">Invitations</Text>

        {isFetching ? (
          <View className="items-center py-4">
            <ActivityIndicator color="#0284c7" />
          </View>
        ) : (
          <ScrollView>
            {invitations.map((invitation) => (
              <View key={invitation.id} className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                <Text className="text-gray-800">Email: {invitation.email}</Text>

                <View className="mt-2 flex-row items-center">
                  <Text className="text-gray-600">Status: </Text>
                  <View
                    className={`rounded-full px-2 py-1 ${
                      invitation.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                    <Text
                      className={`text-sm ${
                        invitation.status === 'active' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                      {invitation.status}
                    </Text>
                  </View>
                </View>

                {invitation.status === 'active' && invitation.user && (
                  <View className="mt-2 rounded-lg bg-gray-50 p-2">
                    <Text className="text-sm text-gray-600">Verified User Details:</Text>
                    <Text className="text-sm text-gray-800">Email: {invitation.user.email}</Text>
                    <Text className="text-sm text-gray-800">Role: {invitation.user.role}</Text>
                  </View>
                )}

                <View className="mt-2 flex-row justify-between">
                  <Text className="text-sm text-gray-500">
                    Invited: {new Date(invitation.created_at).toLocaleDateString()}
                  </Text>

                  {invitation.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => {
                        sendInvitation();
                        Alert.alert('Success', 'Invitation resent successfully');
                      }}
                      className="rounded-lg bg-sky-100 px-3 py-1">
                      <Text className="text-sm text-sky-700">Resend</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
