import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ArrowLeft, Mail, MessageSquare } from 'lucide-react';
import { useUI } from '../context/UIContext';

const FAQS = [
  {
    q: 'Por que o SÓ AMIZADE é estritamente para amizades?',
    a: 'Criamos o SÓ AMIZADE porque as pessoas sentiam falta de um espaço digital acolhedor para fazer amizades reais sem a pressão, aparências superficiais e segundas intenções dos aplicativos de namoro.',
  },
  {
    q: 'Qualquer pessoa pode se cadastrar?',
    a: 'O SÓ AMIZADE é exclusivo para pessoas com 18 anos ou mais. A data de nascimento é exigida no cadastro para comprovação legal da maioridade, mas permanece privada e nunca é exibida aos demais membros.',
  },
  {
    q: 'Desconhecidos podem me mandar mensagens privadas?',
    a: 'Não! Para proteger sua tranquilidade e segurança, o chat direto 1-a-1 só é liberado após ambas as pessoas aceitarem mutuamente a solicitação de amizade.',
  },
  {
    q: 'O que acontece se alguém fizer propostas românticas ou de namoro?',
    a: 'Isso viola frontalmente a proposta do SÓ AMIZADE. Você pode denunciar a pessoa imediatamente. Nossos moderadores analisam as evidências e aplicam penalidades imediatas, incluindo advertência ou banimento.',
  },
  {
    q: 'Como funciona o plano SÓ AMIZADE+?',
    a: 'É um plano opcional de apoio à plataforma (R$ 9,90/mês ou R$ 99,00/ano) que oferece selo dourado no perfil, temas exclusivos, navegação sem anúncios e criação de até 15 comunidades.',
  },
  {
    q: 'Como posso excluir minha conta ou solicitar meus dados?',
    a: 'Na aba Configurações e Privacidade, você encontra os botões "Baixar Meus Dados (JSON)" e "Excluir Minha Conta", em cumprimento integral à LGPD.',
  },
];

export const HelpCenter: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { openSupportModal } = useUI();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Central de Ajuda & Dúvidas Frequentes
        </h1>
        <p className="text-xs text-slate-400">
          Encontre respostas rápidas sobre o funcionamento e segurança do SÓ AMIZADE.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {isOpen && (
                <div className="p-4 pt-0 text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support contact info */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-500/10 via-indigo-500/10 to-transparent border border-teal-200/80 dark:border-teal-900/40 text-xs space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex-shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              Precisa de ajuda personalizada da moderação?
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Nossa equipe de suporte oficial atende pelo e-mail{' '}
              <strong className="text-teal-600 dark:text-teal-400 font-mono">tecnomail09@gmail.com</strong>.
              Você pode enviar uma mensagem diretamente pelo aplicativo clicando no botão abaixo:
            </p>
          </div>
        </div>

        <div className="pt-1 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => openSupportModal('Dúvida Geral')}
            className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/30 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Abrir Chamado de Suporte</span>
          </button>
          <a
            href="mailto:tecnomail09@gmail.com?subject=Suporte%20S%C3%93%20AMIZADE"
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
          >
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Enviar E-mail Direto</span>
          </a>
        </div>
      </div>
    </div>
  );
};
