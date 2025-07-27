import React from 'react';
import { Navbar } from './Navbar';
import { Toaster } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
};