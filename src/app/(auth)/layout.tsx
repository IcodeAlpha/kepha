import { FirebaseClientProvider } from '@/firebase';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <div style={{ background: '#F5F0E8', minHeight: '100vh' }}>
        {children}
      </div>
    </FirebaseClientProvider>
  );
}