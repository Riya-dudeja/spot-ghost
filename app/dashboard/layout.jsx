import DashboardLayout from '@/components/DashboardLayout';
import AuthProtection from '@/components/AuthProtection';

export default function Layout({ children }) {
  return (
    <AuthProtection>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProtection>
  );
}
