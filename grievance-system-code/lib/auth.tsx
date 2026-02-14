'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface UserRole {
  uid: string;
  email: string;
  role: 'student' | 'authority' | 'admin';
  department?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: 'student' | 'authority' | 'admin', name: string, department?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data() as UserRole);
        } else {
          // Create default student role if not exists
          const defaultRole: UserRole = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'student',
            name: firebaseUser.displayName || '',
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), defaultRole);
          setUserRole(defaultRole);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (
    email: string, 
    password: string, 
    role: 'student' | 'authority' | 'admin',
    name: string,
    department?: string
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userRole: UserRole = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      role,
      name,
      department,
    };
    await setDoc(doc(db, 'users', userCredential.user.uid), userRole);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      // Create default student role
      const defaultRole: UserRole = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        role: 'student',
        name: userCredential.user.displayName || '',
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), defaultRole);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, signup, loginWithGoogle, logout }}>
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

