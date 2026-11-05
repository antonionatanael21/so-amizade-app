import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import {
  LifeBuoy,
  X,
  Send,
  CheckCircle2,
  Mail,
  User,
  Tag,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  'Dúvida Geral',
  'Problema Técnico ou Bug',
  'Acesso / Recuperação de Conta',
  'Denúncia ou Moderação',
  'Assinatura SÓ AMIZADE+',
  'Sugestão de Funcionalidade',
  'Outro Assunto',
];

export const SupportModal: React.FC = () => {
  const { currentUser, profile } = useAuth();
  const { supportModal, closeSupportModal, showToast } = useUI();

  const [category, setCategory] = useState<string>(supportModal.defaultCategory || 'Dúvida Geral');
  const [subject, setSubject] = useState<string>(supportModal.defaultSubject || '');
  const [message, setMessage] = useState<string>('');
  const [name, setName] = useState<string>(profile?.displayName || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketId: string;
    mailtoFallback: string;
  } | null>(null);

  if (!supportModal.isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      showToast('Por favor, preencha seu e-mail e a mensagem.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketId = `LOCAL-${Date.now().toString(36).slice(-6).toUpperCase()}`;
      const cleanName = name.trim() || 'Membro do SÓ AMIZADE';
      const cleanSubject = subject.trim() || `Atendimento [${category}]`;
      const body = [
        `Nome: ${cleanName}`,
        `E-mail para resposta: ${email.trim()}`,
        `Categoria: ${category}`,
        `Referência local: ${ticketId}`,
        '',
        'Mensagem:',
        message.trim(),
      ].join('\n');
      const mailtoFallback = `mailto:tecnomail09@gmail.com?subject=${encodeURIComponent(`[SÓ AMIZADE] ${cleanSubject}`)}&body=${encodeURIComponent(body)}`;
      setSubmittedTicket({ ticketId, mailtoFallback });
      showToast('Rascunho preparado. Confirme o envio no seu aplicativo de e-mail.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setMessage('');
    setSubject('');
    closeSupportModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                Suporte SÓ AMIZADE
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Canal de contato: <strong className="text-teal-600 dark:text-teal-400">tecnomail09@gmail.com</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {submittedTicket ? (
            <div className="text-center space-y-4 py-4 animate-scale-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Solicitação pronta para envio
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                A referência local desta mensagem é{' '}
                <strong className="text-teal-600 dark:text-teal-400 font-mono text-sm">
                  #{submittedTicket.ticketId}
                </strong>{' '}
                mas ela ainda não foi enviada. Abra seu aplicativo de e-mail, revise a mensagem e toque em enviar para encaminhá-la a <span className="font-semibold">tecnomail09@gmail.com</span>.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={submittedTicket.mailtoFallback}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir no meu app de E-mail</span>
                </a>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Seu Nome
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Como deseja ser chamado(a)"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Seu E-mail para Resposta
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Categoria da Mensagem
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Assunto
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Resumo em poucas palavras"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Mensagem Detalhada
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explique detalhadamente sua dúvida ou situação para que possamos ajudar você da melhor forma..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                <AlertCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>
                  Ao continuar, o aplicativo de e-mail será aberto com sua mensagem preenchida. Você precisará confirmar o envio para <strong className="text-slate-700 dark:text-slate-200">tecnomail09@gmail.com</strong>.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Preparando...' : 'Preparar e-mail para o Suporte'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
