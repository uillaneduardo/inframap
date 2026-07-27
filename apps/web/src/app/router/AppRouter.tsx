import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { ProjectListPage } from '../../features/workspace/projects/ProjectListPage';
import { EditorPage } from '../../features/workspace/editor/EditorPage';
import { LibraryPage } from '../../features/library/LibraryPage';
import { ConsolePage } from '../../features/console/ConsolePage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/workspace/projects" replace />} />
          <Route path="workspace" element={<Navigate to="/workspace/projects" replace />} />
          <Route path="workspace/projects" element={<ProjectListPage />} />
          <Route path="workspace/projects/:projectId" element={<EditorPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="console" element={<ConsolePage />} />
          <Route path="*" element={<Navigate to="/workspace/projects" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
