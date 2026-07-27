import React from 'react';
import { Library, HardDrive, Plug, Cable } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LibraryPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-900/40 text-blue-400 rounded-xl border border-blue-800/40">
          <Library className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t('library.title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('library.description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
          <div className="p-2.5 bg-slate-800 text-blue-400 w-fit rounded-lg">
            <HardDrive className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Equipamentos & Racks</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Modelos de servidores 1U–48U, switches FortiGate/Cisco, patch panels e PDUs para posicionamento visual preciso.
          </p>
          <span className="text-[11px] font-mono text-slate-500 mt-auto">Etapa Futura</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
          <div className="p-2.5 bg-slate-800 text-emerald-400 w-fit rounded-lg">
            <Plug className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Portas & Conectores</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mapeamento lógico e físico de portas RJ45, LC/SC Fibra, SFP/SFP+ e tomadas de energia.
          </p>
          <span className="text-[11px] font-mono text-slate-500 mt-auto">Etapa Futura</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
          <div className="p-2.5 bg-slate-800 text-amber-400 w-fit rounded-lg">
            <Cable className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Cabos & Conexões</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Definição de cabos Cat6/Cat6a, patch cords, cordões ópticos e traçados de esteiramento/eletrocalhas.
          </p>
          <span className="text-[11px] font-mono text-slate-500 mt-auto">Etapa Futura</span>
        </div>
      </div>
    </div>
  );
};
