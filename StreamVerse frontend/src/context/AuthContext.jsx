import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const { data } = await API.get('/users/current-user');
      setProfile(data.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Handle OAuth callback - check for hash fragment with access token
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      console.log('Current URL hash:', hash ? 'Has hash' : 'No hash');
      
      if (hash && (hash.includes('access_token') || hash.includes('error'))) {
        console.log('Processing OAuth callback...');
        try {
          // Parse the hash fragment to extract tokens
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            console.log('Found access token, setting session...');
            // Set the session manually using the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error setting session:', error);
            } else {
              console.log('Session set successfully:', data.user?.email);
              
              // Check if there's a redirect URL saved
              const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
              if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterLogin');
                // Clean up the URL first, then redirect
                window.history.replaceState(null, '', window.location.pathname);
                window.location.href = redirectUrl;
                return;
              }
            }
          }
          
          // Clean up the URL
          window.history.replaceState(null, '', window.location.pathname);
        } catch (err) {
          console.error('OAuth callback error:', err);
        }
      }
    };

    // Process OAuth callback first, then check session
    handleOAuthCallback().then(() => {
      // Check active sessions and sets the user
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Session check:', session ? 'Found - ' + session.user?.email : 'None');
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile();
        }
        setLoading(false);
      });
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error("Supabase client not initialized");
      throw new Error("Authentication service not available. Please check configuration.");
    }
    
    console.log("Starting Google OAuth, redirectTo:", window.location.origin);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    
    console.log("OAuth response:", { data, error });
    
    if (error) throw error;
    return data;
  };

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata, // fullname, username, etc.
      },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  const value = {
    user: profile || user,
    supabaseUser: user,
    profile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    setUser,
    setProfile,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
