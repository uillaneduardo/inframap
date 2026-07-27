import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Library, Settings, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    {
      to: '/workspace/projects',
      label: t('nav.workspace'),
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      to: '/library',
      label: t('nav.library'),
      icon: <Library className="w-4 h-4" />,
    },
    {
      to: '/console',
      label: t('nav.console'),
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <header className="h-11 theme-bg-menu border-b theme-border flex items-center justify-between px-4 theme-text-main select-none z-40 shrink-0">
      <div className="flex items-center gap-6">
        <NavLink to="/workspace/projects" className="flex items-center gap-2 font-bold text-sm tracking-wide theme-text-main hover:text-blue-500 transition-colors">
          <div className="p-1 bg-blue-600 rounded-md text-white">
            <Server className="w-4 h-4" />
          </div>
          <span>InfraMap</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-500 border border-blue-500/20 font-mono">MVP</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-[var(--bg-surface-active)] text-blue-500 font-semibold'
                    : 'theme-text-muted hover:theme-text-main hover:bg-[var(--bg-surface-hover)]'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 text-xs theme-text-muted">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full theme-bg-surface border theme-border text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Modo Local (IndexedDB)
        </span>
      </div>
    </header>
  );
};
