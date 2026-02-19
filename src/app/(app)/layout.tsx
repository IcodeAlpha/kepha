import { AuthGuard } from '@/components/auth-guard';
 
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* your existing sidebar/nav layout here */}
      {children}
    </AuthGuard>
  );
}
