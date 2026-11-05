import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const TermsOfUse: React.FC<{ onBack: () => void }> = ({ onBack }) => {
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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Termos de Uso</h1>
        <p className="text-xs text-slate-400">Última atualização: Novembro de 2026</p>
      </div>

      <div className="prose dark:prose-invert text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          1. Objeto e Conceito da Plataforma
        </h3>
        <p>
          O <strong>SÓ AMIZADE</strong> é uma plataforma digital dedicada exclusivamente à criação, manutenção e desenvolvimento de amizades verdadeiras, diálogos construtivos e comunidades temáticas. <strong>Esta plataforma NÃO é um aplicativo de encontros amorosos, namoro, paquera ou solicitações de cunho sexual.</strong>
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          2. Requisito Inegociável de Maioridade (18+ Anos)
        </h3>
        <p>
          O acesso e o cadastro no SÓ AMIZADE são restritos exclusivamente a pessoas físicas com idade igual ou superior a 18 (dezoito) anos completos na data do registro. O fornecimento de data de nascimento inverídica constitui violação contratual grave e falsidade ideológica, sujeitando o infrator ao cancelamento imediato da conta e às providências legais cabíveis.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          3. Condutas Expressamente Proibidas
        </h3>
        <p>É terminantemente vedado a qualquer usuário:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Enviar mensagens, publicações ou comentários de teor sexual, erótico ou amoroso não solicitado;</li>
          <li>Praticar assédio, perseguição (stalking), ameaças, intimidação ou constrangimento;</li>
          <li>Disseminar qualquer forma de discurso de ódio, racismo, homofobia, intolerância religiosa ou preconceito;</li>
          <li>Criar perfis falsos, passar-se por outrem ou aplicar golpes financeiros;</li>
          <li>Publicar ou solicitar dados pessoais confidenciais de terceiros (doxxing);</li>
          <li>Praticar spam ou divulgação comercial não autorizada.</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          4. Moderação e Penalidades
        </h3>
        <p>
          A moderação do SÓ AMIZADE atua de forma rigorosa na preservação do ambiente saudável, aplicando advertências, suspensões temporárias e banimentos definitivos em casos comprovados de violação.
        </p>
      </div>
    </div>
  );
};
