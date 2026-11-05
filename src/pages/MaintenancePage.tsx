import React from 'react';
import { Wrench, ShieldCheck } from 'lucide-react';

export const MaintenancePage: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
          <Wrench className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Manutenção Programada</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Estamos atualizando nossos servidores para oferecer uma experiência ainda mais rápida, segura e acolhedora para toda a comunidade SÓ AMIZADE.
        </p>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-teal-400 font-mono">
          Previsão de retorno: poucos minutos
        </div>
        <button
          onClick={onDismiss}
          className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
        >
          Fechar Modo de Demonstração
        </button>
      </div>
    </div>
  );
};
