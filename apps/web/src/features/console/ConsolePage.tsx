import React from 'react';
import { Settings, Users, Shield, Building2, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ConsolePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-900/40 text-purple-400 rounded-xl border border-purple-800/40">
          <Settings className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t('console.title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('console.description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-4">
          <div className="p-2.5 bg-slate-800 text-purple-400 rounded-lg shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Organizações & Tenancy</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Gestão da organização ativa, troca de contextos, personalização de marca e configurações de conta.
            </p>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-4">
          <div className="p-2.5 bg-slate-800 text-blue-400 rounded-lg shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Membros & Permissões</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Convite de membros por e-mail, atribuição de perfis (Admin, Editor, Leitor) e controle de acesso granular.
            </p>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-4">
          <div className="p-2.5 bg-slate-800 text-emerald-400 rounded-lg shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Auditoria & Logs</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Histórico de alterações em projetos, auditoria de acessos e trilha de conformidade para equipes de TI.
            </p>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-4">
          <div className="p-2.5 bg-slate-800 text-amber-400 rounded-lg shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Plano & Faturamento</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Subscrição SaaS, limites de uso de projetos, cotas de armazenamento e faturamento corporativo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
