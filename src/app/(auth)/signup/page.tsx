'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore, initiateEmailSignUp } from '@/firebase';
 
// createUserProfile — call this after ANY sign-up method
async function createUserProfile(firestore, user, displayName?: string) {
  const userRef = doc(firestore, 'users', user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    name: displayName || user.displayName || 'Reader',
    avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
    bio: '',
    favoriteGenres: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true }); // merge: true prevents overwriting on Google sign-in
}
 
export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
 
  const handleEmailSignup = async () => {
    setError('');
    try {
      const cred = await import('firebase/auth').then(m =>
        m.createUserWithEmailAndPassword(auth, email, password)
      );
      await updateProfile(cred.user, { displayName: name });
      await createUserProfile(firestore, cred.user, name);
      router.push('/dashboard');
    } catch (e: any) { setError(e.message); }
  };
 
  const handleGoogleSignup = async () => {
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await createUserProfile(firestore, cred.user);
      router.push('/dashboard');
    } catch (e: any) { setError(e.message); }
  };
 
  return (
    <Card>
      <CardHeader><CardTitle>Create your account</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGoogleSignup} variant="outline" className="w-full">
          Sign up with Google
        </Button>
        <div className="space-y-2">
          <Label>Display name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleEmailSignup} className="w-full">Create Account</Button>
      </CardContent>
    </Card>
  );
}
