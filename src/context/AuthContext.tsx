import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  signInWithPopup,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  fbSignOut,
  FirebaseUser,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
} from 'firebase/firestore';
import { UserProfile } from '../types';
import { calculateAge } from '../utils/age';

const GOOGLE_SIGNUP_BIRTHDATE_KEY = 'soamizade_pending_google_birthdate';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithGoogle: (birthDate?: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (data: {
    email: string;
    pass: string;
    displayName: string;
    username: string;
    birthDate: string;
    is18Plus: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  verifyAge: (birthDate: string) => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BOOTSTRAP_ADMIN_EMAILS = ['antonionatanael140@gmail.com', 'tecnomail09@gmail.com'];

const isBootstrapAdmin = (email?: string | null) =>
  Boolean(email && BOOTSTRAP_ADMIN_EMAILS.some((admin) => admin.toLowerCase() === email.toLowerCase()));

const privateIdentityRef = (uid: string) => doc(db, 'users', uid, 'private', 'identity');

async function verifyBirthDateWithServer(birthDate: string) {
  const localValidation = calculateAge(birthDate);
  if (!localValidation.isValid) {
    throw new Error(localValidation.error || 'A idade mínima exigida é 18 anos.');
  }

  // A Netlify Function é o endpoint principal. A rota /api é mantida como
  // compatibilidade com o redirect configurado em netlify.toml e com o Express.
  const endpoints = [
    '/.netlify/functions/verify-age',
    '/api/verify-age',
  ];
  let lastFailure = '';

  for (const endpoint of endpoints) {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ birthDate }),
      });
    } catch {
      lastFailure = `Não foi possível conectar ao endpoint ${endpoint}.`;
      continue;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      lastFailure = `O endpoint ${endpoint} não respondeu com JSON (HTTP ${response.status}).`;
      continue;
    }

    const result = await response.json().catch(() => null);
    if (response.ok && result?.valid === true) return;

    // Erros de rota/infraestrutura permitem tentar o endpoint alternativo.
    if ([404, 405, 500, 502, 503, 504].includes(response.status) || !result) {
      lastFailure = `O endpoint ${endpoint} respondeu com HTTP ${response.status}.`;
      continue;
    }

    throw new Error(
      result?.error || 'A data de nascimento não foi aprovada pela validação do servidor.'
    );
  }

  throw new Error(
    'A validação de idade do servidor não está disponível neste deploy. ' +
    'Confirme se o repositório completo foi conectado à Netlify e se netlify.toml e netlify/functions/verify-age.mjs estão presentes. ' +
    lastFailure
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (uid: string, email: string): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return null;

      const rawData = snap.data() as Record<string, any>;
      const { email: legacyEmail, birthDate: legacyBirthDate, ...publicFields } = rawData;
      const privateRef = privateIdentityRef(uid);
      const privateSnap = await getDoc(privateRef);
      const privateData = privateSnap.exists() ? privateSnap.data() : {};
      const storedBirthDate = privateData.birthDate || legacyBirthDate || '';
      const storedEmail = privateData.email || legacyEmail || email || '';

      // Migrate older records: e-mail and birth date must not remain in public profiles.
      if (!privateSnap.exists() || legacyEmail || legacyBirthDate) {
        await setDoc(
          privateRef,
          {
            email: storedEmail,
            ...(storedBirthDate ? { birthDate: storedBirthDate } : {}),
            migratedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      if (legacyEmail || legacyBirthDate) {
        const cleanup: Record<string, any> = {};
        if (legacyEmail) cleanup.email = deleteField();
        if (legacyBirthDate) cleanup.birthDate = deleteField();
        await updateDoc(userRef, cleanup);
      }

      // Older Google accounts may have been marked 18+ without a birth date.
      // Require those accounts to complete the age step before using social features.
      const ageIsVerified = Boolean(storedBirthDate && calculateAge(String(storedBirthDate)).isValid);
      if (publicFields.is18Plus !== ageIsVerified) {
        await updateDoc(userRef, { is18Plus: ageIsVerified });
      }

      // Bootstrap administrators are promoted only after Firebase confirms the
      // e-mail address. Register the admin marker first so the Firestore rules
      // can authorize the protected role update.
      if (isBootstrapAdmin(email) && auth.currentUser?.emailVerified && publicFields.role !== 'admin') {
        await setDoc(doc(db, 'admins', uid), {
          id: uid,
          email: email.toLowerCase(),
          assignedAt: new Date().toISOString(),
        }, { merge: true });
        await updateDoc(userRef, { role: 'admin' });
        publicFields.role = 'admin';
      }

      const safeProfile = { ...publicFields, is18Plus: ageIsVerified } as UserProfile;
      setProfile(safeProfile);
      return safeProfile;
    } catch (err) {
      console.error('Erro ao carregar perfil do usuário:', err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setError(null);
      if (!user) {
        setCurrentUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setCurrentUser(user);
      const existingProfile = await fetchProfile(user.uid, user.email || '');
      if (!existingProfile) {
        let pendingBirthDate = '';
        try {
          pendingBirthDate = sessionStorage.getItem(GOOGLE_SIGNUP_BIRTHDATE_KEY) || '';
        } catch {
          pendingBirthDate = '';
        }
        const ageIsVerified = Boolean(pendingBirthDate && calculateAge(pendingBirthDate).isValid);
        const username = (user.email?.split('@')[0] || `user_${user.uid.slice(0, 6)}`)
          .toLowerCase()
          .replace(/[^a-z0-9_.-]/g, '')
          .slice(0, 30);
        const isAdminUser = isBootstrapAdmin(user.email) && user.emailVerified;

        const newProfile: UserProfile = {
          id: user.uid,
          username: username || `user_${user.uid.slice(0, 6)}`,
          displayName: (user.displayName || 'Novo Membro').slice(0, 70),
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          coverURL: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80',
          bio: 'Aqui para fazer boas amizades verdadeiras!',
          role: isAdminUser ? 'admin' : 'user',
          plan: 'free',
          is18Plus: ageIsVerified,
          isSuspended: false,
          isBanned: false,
          allowFriendRequests: true,
          isProfilePublic: true,
          createdAt: new Date().toISOString(),
        };

        try {
          // Write private identity first: Firestore rules only allow an adult profile
          // when its private identity record already exists.
          await setDoc(privateIdentityRef(user.uid), {
            email: user.email || '',
            ...(ageIsVerified ? { birthDate: pendingBirthDate, ageVerifiedAt: new Date().toISOString() } : {}),
          }, { merge: true });
          await setDoc(doc(db, 'users', user.uid), newProfile);
          if (isAdminUser) {
            await setDoc(doc(db, 'admins', user.uid), {
              id: user.uid,
              email: user.email,
              assignedAt: new Date().toISOString(),
            }).catch((e) => console.warn('Aviso ao registrar admin:', e));
          }
          setProfile(newProfile);
        } catch (createErr) {
          console.error('Erro ao criar perfil inicial:', createErr);
        } finally {
          try {
            sessionStorage.removeItem(GOOGLE_SIGNUP_BIRTHDATE_KEY);
          } catch {
            // Storage may be unavailable in restricted browser contexts.
          }
        }
      }
      // Never keep a pending Google sign-up birth date in browser storage after auth resolution.
      try {
        sessionStorage.removeItem(GOOGLE_SIGNUP_BIRTHDATE_KEY);
      } catch {
        // Storage may be unavailable in restricted browser contexts.
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (birthDate?: string) => {
    try {
      setError(null);
      if (birthDate) {
        await verifyBirthDateWithServer(birthDate);
        try {
          sessionStorage.setItem(GOOGLE_SIGNUP_BIRTHDATE_KEY, birthDate);
        } catch {
          throw new Error('Não foi possível preparar o cadastro com segurança neste navegador.');
        }
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      try {
        sessionStorage.removeItem(GOOGLE_SIGNUP_BIRTHDATE_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
      setError(err?.message || 'Falha ao autenticar com Google.');
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      let msg = 'Erro ao efetuar login.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Muitas tentativas sem sucesso. Aguarde alguns instantes.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (data: {
    email: string;
    pass: string;
    displayName: string;
    username: string;
    birthDate: string;
    is18Plus: boolean;
  }) => {
    try {
      setError(null);
      await verifyBirthDateWithServer(data.birthDate);
      try {
        sessionStorage.setItem(GOOGLE_SIGNUP_BIRTHDATE_KEY, data.birthDate);
      } catch {
        throw new Error('Este navegador não permitiu preparar o cadastro com segurança. Ative o armazenamento do site e tente novamente.');
      }
      const res = await createUserWithEmailAndPassword(auth, data.email, data.pass);
      const user = res.user;
      const isAdminUser = isBootstrapAdmin(data.email) && user.emailVerified;

      const newProfile: UserProfile = {
        id: user.uid,
        displayName: data.displayName.trim(),
        username: data.username.toLowerCase().trim(),
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        coverURL: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80',
        bio: 'Olá! Sou novo(a) no SÓ AMIZADE e quero construir conexões reais e conversas saudáveis.',
        is18Plus: true,
        role: isAdminUser ? 'admin' : 'user',
        plan: 'free',
        isSuspended: false,
        isBanned: false,
        allowFriendRequests: true,
        isProfilePublic: true,
        createdAt: new Date().toISOString(),
      };

      await setDoc(privateIdentityRef(user.uid), {
        email: data.email.trim().toLowerCase(),
        birthDate: data.birthDate,
        ageVerifiedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);

      try {
        await sendEmailVerification(user);
      } catch (e) {
        console.warn('Não foi possível enviar e-mail de verificação imediatamente:', e);
      }
    } catch (err: any) {
      try {
        sessionStorage.removeItem(GOOGLE_SIGNUP_BIRTHDATE_KEY);
      } catch {
        // Ignore cleanup failures in restricted browser contexts.
      }
      let msg = 'Erro no cadastro.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está cadastrado no sistema.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'A senha deve conter no mínimo 6 caracteres.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setCurrentUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError('Falha ao enviar e-mail de redefinição de senha.');
      throw err;
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  };

  const verifyAge = async (birthDate: string) => {
    if (!currentUser) throw new Error('Faça login para concluir a verificação de idade.');
    await verifyBirthDateWithServer(birthDate);
    await setDoc(privateIdentityRef(currentUser.uid), {
      email: currentUser.email || '',
      birthDate,
      ageVerifiedAt: new Date().toISOString(),
    }, { merge: true });
    await updateDoc(doc(db, 'users', currentUser.uid), {
      is18Plus: true,
      updatedAt: new Date().toISOString(),
    });
    setProfile((previous) => previous ? { ...previous, is18Plus: true } : previous);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const payload: Record<string, any> = { ...data, updatedAt: new Date().toISOString() };
      delete payload.role;
      delete payload.plan;
      delete payload.isSuspended;
      delete payload.isBanned;
      delete payload.is18Plus;
      delete payload.id;
      delete payload.email;
      delete payload.birthDate;

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const fallbackUsername = (currentUser.email?.split('@')[0] || `user_${currentUser.uid.slice(0, 6)}`)
          .toLowerCase()
          .replace(/[^a-z0-9_.-]/g, '');
        const isAdminUser = isBootstrapAdmin(currentUser.email) && currentUser.emailVerified;
        const newProfile: UserProfile = {
          id: currentUser.uid,
          username: (payload.username || fallbackUsername).toLowerCase().slice(0, 30),
          displayName: (payload.displayName || currentUser.displayName || 'Novo Membro').slice(0, 70),
          photoURL: payload.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
          coverURL: payload.coverURL || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80',
          bio: payload.bio || 'Aqui para fazer boas amizades verdadeiras!',
          role: isAdminUser ? 'admin' : 'user',
          plan: 'free',
          is18Plus: false,
          isSuspended: false,
          isBanned: false,
          allowFriendRequests: payload.allowFriendRequests !== false,
          isProfilePublic: payload.isProfilePublic !== false,
          createdAt: new Date().toISOString(),
          ...payload,
        };
        await setDoc(userRef, newProfile);
        await setDoc(privateIdentityRef(currentUser.uid), { email: currentUser.email || '' }, { merge: true });
        setProfile(newProfile);
        return;
      }

      await updateDoc(userRef, payload);
      setProfile((previous) => previous ? { ...previous, ...payload } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) await fetchProfile(currentUser.uid, currentUser.email || '');
  };

  const isAdmin = isBootstrapAdmin(currentUser?.email) || profile?.role === 'admin';
  const isModerator = isAdmin || profile?.role === 'moderator';

  return (
    <AuthContext.Provider value={{
      currentUser,
      profile,
      isAdmin,
      isModerator,
      isLoading,
      error,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      resetPassword,
      resendVerificationEmail,
      verifyAge,
      updateProfileData,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  return context;
};
