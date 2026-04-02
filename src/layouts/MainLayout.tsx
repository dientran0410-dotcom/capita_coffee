import type { ReactNode } from 'react';
import Sidebar from '../components/layout/SideBar';

interface MainLayoutProps {
  children: ReactNode;
  userRole?: string;
}

const MainLayout = ({ children = 'user' }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
