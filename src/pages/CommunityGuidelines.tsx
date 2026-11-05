import React from 'react';
import { HeartHandshake, ShieldAlert, ArrowLeft, Check, X } from 'lucide-react';

export const CommunityGuidelines: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 pb-20 md:pb-10">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </button>

      <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400">
          <HeartHandshake className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Compromisso de Convivência</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Diretrizes da Comunidade SÓ AMIZADE
        </h1>
        <p className="text-xs text-slate-400">
          Como construímos um refúgio acolhedor e verdadeiro na internet.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-teal-800 dark:text-teal-300 text-sm">
            <Check className="w-4 h-4" />
            <span>O que incentivamos com entusiasmo:</span>
          </div>
          <ul className="text-xs text-teal-900/80 dark:text-teal-200/80 space-y-1.5 list-disc list-inside">
            <li>Conversas saudáveis sobre interesses em comum;</li>
            <li>Apoio mútuo e empatia sincera;</li>
            <li>Respeito à diversidade de origens e opiniões;</li>
            <li>Criação de comunidades culturais, literárias e de hobbies;</li>
            <li>Boas-vindas calorosas aos novos membros.</li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-rose-800 dark:text-rose-300 text-sm">
            <X className="w-4 h-4" />
            <span>O que é expressamente proibido:</span>
          </div>
          <ul className="text-xs text-rose-900/80 dark:text-rose-200/80 space-y-1.5 list-disc list-inside">
            <li>Cantadas, flertes, propostas sexuais ou de encontros amorosos;</li>
            <li>Insistência após recusa ou pedido de interrupção de contato;</li>
            <li>Menores de 18 anos tentando ingressar na plataforma;</li>
            <li>Discurso de ódio, discriminação ou bullying;</li>
            <li>Spam, correntes ou esquemas financeiros.</li>
          </ul>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
          Como agir caso presencie uma violação?
        </h4>
        <p>
          Utilize a bandeira de <strong>Denúncia</strong> presente em qualquer perfil, mensagem ou publicação. Nossa equipe analisa cada ocorrência com máxima prioridade e protege a identidade do denunciante sob sigilo irrestrito.
        </p>
      </div>
    </div>
  );
};
