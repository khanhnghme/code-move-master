import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, UserRole, AppRole } from '@/types/database';
import SuspendedScreen from '@/components/SuspendedScreen';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isLeader: boolean;
  isApproved: boolean;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, studentId: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileData) {
      setProfile(profileData as Profile);
    }

    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (rolesData) {
      setRoles(rolesData.map(r => r.role as AppRole));
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            if (isMounted) fetchProfile(session.user.id);
          }, 0);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setRoles([]);
      }
      
      if (isMounted) setIsLoading(false);
    });

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.warn('Session error:', error.message);
          setSession(null);
          setUser(null);
          setProfile(null);
          setRoles([]);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    initSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, studentId: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          student_id: studentId,
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Clear state immediately before async call
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('Sign out error:', error);
    }
  };

  const isAdmin = roles.includes('admin');
  const isLeader = roles.includes('leader') || isAdmin;
  const isApproved = profile?.is_approved ?? false;
  const mustChangePassword = profile?.must_change_password ?? false;

  // Check if user is suspended
  const isSuspended = profile?.suspended_until
    ? new Date(profile.suspended_until).getTime() > Date.now()
    : false;

  const handleUnlocked = useCallback(() => {
    refreshProfile();
  }, [user]);

  // Show suspended screen if user is logged in but suspended (and not admin)
  if (user && profile && isSuspended && !isAdmin) {
    return (
      <AuthContext.Provider
        value={{
          user, session, profile, roles, isLoading,
          isAdmin, isLeader, isApproved, mustChangePassword,
          signIn, signUp, signOut, refreshProfile,
        }}
      >
        <SuspendedScreen
          suspendedUntil={profile.suspended_until!}
          suspensionReason={profile.suspension_reason}
          onSignOut={signOut}
          onUnlocked={handleUnlocked}
        />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, roles, isLoading,
        isAdmin, isLeader, isApproved, mustChangePassword,
        signIn, signUp, signOut, refreshProfile,
      }}
    >
      {children}
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