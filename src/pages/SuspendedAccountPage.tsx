import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { AlertOctagon, Send, LogOut, CheckCircle2 } from 'lucide-react';

export const SuspendedAccountPage: React.FC = () => {
  const { currentUser, profile, logout } = useAuth();
  const { showToast } = useUI();

  const [appealText, setAppealText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !appealText.trim()) return;

    setIsSubmitting(true);
    try {
      const appealId = `appeal_${currentUser.uid}_${Date.now()}`;
      await setDoc(doc(db, 'accountAppeals', appealId), {
        id: appealId,
        userId: currentUser.uid,
        userEmail: currentUser.email || 'desconhecido',
        reason: appealText.trim(),
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });
      setSubmitted(true);
      showToast('Seu recurso foi registrado com sucesso e será revisado.', 'success');
    } catch (e) {
      showToast('Erro ao enviar recurso. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="max-w-lg w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Conta Temporariamente Suspensa
          </h1>
          <p className="text-xs text-slate-400">
            Identificamos uma possível violação das diretrizes de convivência ou segurança do SÓ AMIZADE.
          </p>
        </div>

        {profile?.suspensionReason && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 text-left space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Motivo registrado:</span>
            <p>{profile.suspensionReason}</p>
          </div>
        )}

        {/* Appeal Form */}
        {submitted ? (
          <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-900/60 text-xs text-teal-300 space-y-2">
            <CheckCircle2 className="w-6 h-6 text-teal-400 mx-auto" />
            <p className="font-bold">Recurso Enviado</p>
            <p>
              Nossa equipe de moderação revisará as evidências e o seu relato em até 48 horas úteis.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendAppeal} className="space-y-3 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Apresentar recurso / esclarecimento à moderação
            </label>
            <textarea
              required
              rows={4}
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              placeholder="Descreva o que ocorreu, caso acredite que houve um engano ou mal-entendido..."
              maxLength={2000}
              className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !appealText.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Enviando Recurso...' : 'Enviar Recurso para Revisão'}</span>
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white mx-auto transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
