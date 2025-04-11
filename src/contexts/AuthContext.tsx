import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check if token is expired
          const expiresAt = session.expires_at;
          if (expiresAt && expiresAt * 1000 < Date.now()) {
            // Token is expired, redirect to login
            window.location.href = '/login?error=expired_token';
            return;
          }

          setUser(session.user);
          // Store user info in localStorage
          localStorage.setItem('user', JSON.stringify({
            email: session.user.email,
            name: session.user.user_metadata?.full_name,
            avatar: session.user.user_metadata?.avatar_url,
          }));
        } else {
          // Check localStorage for existing user data
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            localStorage.removeItem('user'); // Clear invalid data
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify({
          email: session.user.email,
          name: session.user.user_metadata?.full_name,
          avatar: session.user.user_metadata?.avatar_url,
        }));
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isLoading: loading,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 