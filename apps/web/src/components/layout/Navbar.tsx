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
    <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 text-slate-200 select-none z-40">
      <div className="flex items-center gap-6">
        <NavLink to="/workspace/projects" className="flex items-center gap-2 font-bold text-sm tracking-wide text-white hover:text-blue-400 transition-colors">
          <div className="p-1.5 bg-blue-600 rounded-md text-white">
            <Server className="w-4 h-4" />
          </div>
          <span>InfraMap</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50 font-mono">MVP</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-slate-800 text-blue-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Modo Local (IndexedDB)
        </span>
      </div>
    </header>
  );
};
