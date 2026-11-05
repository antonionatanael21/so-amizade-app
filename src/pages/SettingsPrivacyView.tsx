import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import {
  Shield,
  Lock,
  Download,
  Trash2,
  UserCheck,
  Ban,
  Bell,
  Eye,
  CheckCircle,
  AlertTriangle,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';

export const SettingsPrivacyView: React.FC<{
  onLogout: () => void;
}> = ({ onLogout }) => {
  void onLogout; // Full account deletion requires the trusted backend; this screen only submits a request.
  const { currentUser, profile, updateProfileData } = useAuth();
  const { showToast, isDark, toggleTheme } = useUI();

  const [allowFriendRequests, setAllowFriendRequests] = useState(
    profile?.allowFriendRequests !== false
  );
  const [isProfilePublic, setIsProfilePublic] = useState(
    profile?.isProfilePublic !== false
  );
  const [blockedList, setBlockedList] = useState<{ id: string; username: string }[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Load blocked users
  useEffect(() => {
    if (!currentUser) return;
    const fetchBlocked = async () => {
      try {
        const q = query(
          collection(db, 'blockedUsers'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const list: { id: string; username: string }[] = [];

        for (const d of snap.docs) {
          const blockedUserId = d.data().blockedUserId;
          const uSnap = await getDoc(doc(db, 'users', blockedUserId));
          if (uSnap.exists()) {
            list.push({
              id: d.id,
              username: uSnap.data().username || 'Usuário',
            });
          }
        }
        setBlockedList(list);
      } catch (e) {
      } finally {
        setLoadingBlocked(false);
      }
    };
    fetchBlocked();
  }, [currentUser]);

  const handleSavePrivacy = async () => {
    try {
      await updateProfileData({
        allowFriendRequests,
        isProfilePublic,
      });
      showToast('Preferências de privacidade atualizadas!', 'success');
    } catch (e) {
      showToast('Erro ao atualizar privacidade.', 'error');
    }
  };

  const handleUnblock = async (blockDocId: string) => {
    try {
      await deleteDoc(doc(db, 'blockedUsers', blockDocId));
      setBlockedList((prev) => prev.filter((b) => b.id !== blockDocId));
      showToast('Usuário desbloqueado com sucesso.');
    } catch (e) {
      showToast('Erro ao desbloquear.', 'error');
    }
  };

  // LGPD: Download My Data in JSON format
  const handleExportData = async () => {
    if (!currentUser || !profile) return;
    setIsExporting(true);
    try {
      const identitySnapshot = await getDoc(doc(db, 'users', currentUser.uid, 'private', 'identity'));
      const identity = identitySnapshot.exists() ? identitySnapshot.data() : {};
      const dataToExport = {
        plataforma: 'SÓ AMIZADE',
        data_solicitacao: new Date().toISOString(),
        termo_lgpd: 'Artigo 18 da Lei Geral de Proteção de Dados (Lei nº 13.709/2018)',
        perfil: {
          id: profile.id,
          nome: profile.displayName,
          usuario: profile.username,
          email: currentUser.email || identity.email || '',
          data_nascimento: identity.birthDate || null,
          biografia: profile.bio,
          cidade: profile.city,
          estado: profile.state,
          interesses: profile.interests,
          criado_em: profile.createdAt,
        },
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soamizade_meus_dados_${profile.username}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Arquivo com dados de perfil e identidade gerado. Mensagens e histórico social não estão incluídos.', 'success');
    } catch (e) {
      showToast('Erro ao exportar dados.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // A full deletion must run through a trusted Firebase Admin backend so that
  // Authentication, Firestore subcollections and related records are all handled.
  // Until that backend is configured, submit an explicit request instead of deleting only one document.
  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    const confirmText = prompt(
      'Para solicitar a exclusão integral da conta, digite "SOLICITAR":'
    );
    if (confirmText !== 'SOLICITAR') {
      showToast('Solicitação cancelada.');
      return;
    }

    const subject = '[LGPD] Solicitação de exclusão integral de conta';
    const body = [
      'Olá, equipe SÓ AMIZADE,',
      '',
      'Solicito a exclusão integral da minha conta e dos dados pessoais associados, conforme a LGPD.',
      `Nome: ${profile?.displayName || 'Não informado'}`,
      `E-mail da conta: ${currentUser.email || 'Não informado'}`,
      `Identificador da conta: ${currentUser.uid}`,
      '',
      'Por favor, confirmem o recebimento e informem quando a exclusão for concluída.',
    ].join('\n');
    const mailto = `mailto:tecnomail09@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    showToast('Seu aplicativo de e-mail foi solicitado. Envie a mensagem para iniciar o pedido de exclusão.', 'info');
  };


  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-2xl font-extrabold tracking-tight">Privacidade & Configurações</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Controle sua privacidade, personalize a aparência e gerencie seus dados. A exclusão integral é solicitada ao suporte.
        </p>
      </div>

      {/* Theme & Appearance Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Palette className="w-5 h-5 text-teal-500" />
          <div>
            <h3 className="font-bold text-base">Aparência do Aplicativo</h3>
            <p className="text-xs text-slate-400">Escolha o tema visual que preferir para navegar no SÓ AMIZADE.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              if (isDark) toggleTheme();
              showToast('Modo Claro ativado!', 'info');
            }}
            className={`p-4 rounded-2xl border text-left transition flex flex-col items-center sm:items-start space-y-2 ${
              !isDark
                ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sun className={`w-5 h-5 ${!isDark ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="font-bold text-xs sm:text-sm">☀️ Modo Claro</span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Fundo branco suave, visual diurno clássico e limpo.
            </p>
            {!isDark && (
              <span className="text-[10px] font-extrabold uppercase text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                Ativo no momento
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isDark) toggleTheme();
              showToast('Modo Escuro ativado!', 'info');
            }}
            className={`p-4 rounded-2xl border text-left transition flex flex-col items-center sm:items-start space-y-2 ${
              isDark
                ? 'bg-teal-500/10 border-teal-500 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Moon className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-slate-400'}`} />
              <span className="font-bold text-xs sm:text-sm">🌙 Modo Escuro</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Fundo escuro elegante (#0b0f19), ideal para a noite e descanso visual.
            </p>
            {isDark && (
              <span className="text-[10px] font-extrabold uppercase text-teal-400 bg-teal-950 px-2 py-0.5 rounded-full border border-teal-800">
                Ativo no momento
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Lock className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-base">Preferências de Visibilidade</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-start justify-between cursor-pointer space-x-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Permitir solicitações de amizade de qualquer membro
              </p>
              <p className="text-xs text-slate-500">
                Quando desativado, apenas amigos de amigos poderão enviar pedidos.
              </p>
            </div>
            <input
              type="checkbox"
              checked={allowFriendRequests}
              onChange={(e) => setAllowFriendRequests(e.target.checked)}
              className="mt-1 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-start justify-between cursor-pointer space-x-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Perfil visível para todos os membros autenticados
              </p>
              <p className="text-xs text-slate-500">
                Seu perfil e interesses aparecerão nas sugestões do Descobrir Amigos.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isProfilePublic}
              onChange={(e) => setIsProfilePublic(e.target.checked)}
              className="mt-1 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSavePrivacy}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-sm transition"
          >
            Salvar Preferências
          </button>
        </div>
      </div>

      {/* Blocked Users */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Ban className="w-5 h-5 text-rose-500" />
          <h3 className="font-bold text-base">Usuários Bloqueados</h3>
        </div>

        {loadingBlocked ? (
          <p className="text-xs text-slate-400">Carregando bloqueios...</p>
        ) : blockedList.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            Você não bloqueou nenhum usuário no momento.
          </p>
        ) : (
          <div className="space-y-2">
            {blockedList.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  @{b.username}
                </span>
                <button
                  onClick={() => handleUnblock(b.id)}
                  className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LGPD Compliance Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Shield className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-base">Direitos e Conformidade LGPD</h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>, você tem o direito de solicitar a qualquer momento uma cópia integral dos dados que mantemos sobre sua conta, ou solicitar a eliminação definitiva.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-teal-500/50 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 text-xs sm:text-sm font-semibold hover:bg-teal-100 transition"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exportando...' : 'Baixar Perfil e Identidade (JSON)'}</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs sm:text-sm font-semibold transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Solicitar exclusão da conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
