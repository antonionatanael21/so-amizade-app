import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { REPORT_CATEGORIES, ReportCategory, ReportItem } from '../../types';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ShieldAlert, X, AlertTriangle, CheckCircle, Flag } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { reportModal, closeReportModal, showToast } = useUI();
  const { currentUser } = useAuth();
  const [category, setCategory] = useState<ReportCategory>('sexual_dating');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!reportModal.isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Você precisa estar autenticado para enviar uma denúncia.', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Por favor, descreva o motivo da denúncia.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Assign priority based on severity
      const priority: 'high' | 'medium' | 'low' =
        category === 'underage' || category === 'sexual_dating' || category === 'harassment'
          ? 'high'
          : category === 'fake_scam' || category === 'privacy_breach'
          ? 'high'
          : 'medium';

      const newReport: ReportItem = {
        id: reportId,
        reporterId: currentUser.uid,
        reporterEmail: currentUser.email || 'confidencial',
        targetType: reportModal.targetType,
        targetId: reportModal.targetId,
        targetAuthorId: reportModal.targetAuthorId,
        targetSnapshot: reportModal.targetSnapshot,
        category,
        reason: reason.trim(),
        evidence: evidence.trim() || undefined,
        status: 'pending',
        priority,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'reports', reportId), newReport);
      showToast('Denúncia recebida com sucesso. Nossa equipe analisará com prioridade.', 'success');
      closeReportModal();
      setReason('');
      setEvidence('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reports');
      showToast('Falha ao enviar denúncia. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/60 dark:bg-rose-950/20">
          <div className="flex items-center space-x-2.5 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Denunciar Violação das Regras
            </h3>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <strong>Ambiente estritamente de amizade e 18+:</strong> É terminantemente proibido qualquer solicitação romântica/sexual, assédio, spam ou presença de menores. Todas as denúncias são tratadas com sigilo absoluto.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Qual é a categoria da violação?
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {REPORT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Descreva o ocorrido com detalhes *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique o que aconteceu, contexto e por que isso viola as diretrizes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              maxLength={1000}
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {reason.length}/1000 caracteres
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Evidências adicionais ou citação (opcional)
            </label>
            <input
              type="text"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Ex.: Trecho exato da mensagem ou link de imagem"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              maxLength={500}
            />
          </div>

          {reportModal.targetSnapshot && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Conteúdo reportado: </span>
              <span className="italic line-clamp-2">"{reportModal.targetSnapshot}"</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={closeReportModal}
              className="px-4 py-2 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-rose-600/30"
            >
              <Flag className="w-4 h-4" />
              <span>{isSubmitting ? 'Enviando...' : 'Confirmar Denúncia'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
