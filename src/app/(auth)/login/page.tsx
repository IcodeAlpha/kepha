'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, initiateEmailSignIn } from '@/firebase';
 
export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
 
  const handleEmailLogin = () => {
    setError('');
    initiateEmailSignIn(auth, email, password);
    router.push('/dashboard');
  };
 
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message);
    }
  };
 
  return (
    <Card>
      <CardHeader><CardTitle>Welcome back</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGoogleLogin} variant="outline" className="w-full">
          Sign in with Google
        </Button>
        <div className="relative"><div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-muted-foreground">or</span></div>
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
        <Button onClick={handleEmailLogin} className="w-full">Sign In</Button>
        <p className="text-center text-sm text-muted-foreground">
          No account? <Link href="/signup" className="text-violet-600 hover:underline">Sign up</Link>
        </p>
      </CardContent>
    </Card>
  );
}
