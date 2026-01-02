
import { AppLayout } from "@/components/app-layout";
import { FirebaseClientProvider } from "@/firebase";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <AppLayout>{children}</AppLayout>
    </FirebaseClientProvider>
  );
}
