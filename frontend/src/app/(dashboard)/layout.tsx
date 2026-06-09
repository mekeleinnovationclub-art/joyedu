import { Navbar } from '@/components/layout/navbar';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { ProtectedRoute } from '@/components/common/route-guards';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <DashboardSidebar />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
