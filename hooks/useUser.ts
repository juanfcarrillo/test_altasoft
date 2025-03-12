import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export function useUser() {
  const { session } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setUser(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`public:customers:id=eq.${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `id=eq.${session.user.id}`,
        },
        (payload) => {
          setUser(payload.new as User);
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, [session]);

  // Function to update user data
  const updateUser = async (updates: Partial<User>) => {
    if (!user?.id) return { error: new Error('No user found') };

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { data: null, error };
    }
  };

  // Function to check if user has specific role
  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  return {
    user,
    loading,
    error,
    updateUser,
    hasRole,
    isAdmin: user?.role === 'admin',
  };
}
