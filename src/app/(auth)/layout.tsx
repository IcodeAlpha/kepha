import { FirebaseClientProvider } from '@/firebase';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-violet-700">📚 Kepha</h1>
            <p className="text-muted-foreground mt-2">Your cozy reading community</p>
          </div>
          {children}
        </div>
      </div>
    </FirebaseClientProvider>
  );
}