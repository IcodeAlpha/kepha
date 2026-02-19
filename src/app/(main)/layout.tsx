
import { AppLayout } from "@/components/app-layout";
import { FirebaseClientProvider } from "@/firebase";
import { AuthGuard } from '@/components/auth-guard';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
    <FirebaseClientProvider>
      <AuthGuard>
      <AppLayout>{children}</AppLayout>
      </AuthGuard>
    </FirebaseClientProvider>
    
  );
}
