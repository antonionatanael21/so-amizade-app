import React from 'react';
import { Home, Compass } from 'lucide-react';

export const NotFoundPage: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
        <span className="text-6xl font-extrabold bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
          404
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Página não encontrada
        </h2>
        <p className="text-xs text-slate-500">
          O link que você seguiu pode estar quebrado ou a página foi removida.
        </p>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
        >
          <Home className="w-4 h-4" />
          <span>Voltar para o Início</span>
        </button>
      </div>
    </div>
  );
};
