import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  // Check if currently on the editor page (/workspace/projects/:projectId)
  const isEditorPage = /^\/workspace\/projects\/[^/]+$/.test(location.pathname);

  return (
    <div className="h-screen w-screen flex flex-col theme-bg-app theme-text-main font-sans antialiased overflow-hidden">
      {!isEditorPage && <Navbar />}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};
