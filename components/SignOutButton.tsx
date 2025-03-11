import { useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';

import { supabase } from '../utils/supabase';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/sign-in');
  };

  return (
    <TouchableOpacity onPress={handleSignOut} className="m-4 rounded-lg bg-red-500 px-4 py-2">
      <Text className="text-white">Sign Out</Text>
    </TouchableOpacity>
  );
}
