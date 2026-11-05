import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import {
  UserProfile,
  ReportItem,
  Community,
  AdminLogItem,
  OfficialAnnouncement,
} from '../types';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  collection,
  query,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  orderBy,
} from 'firebase/firestore';
import {
  Shield,
  Users,
  AlertTriangle,
  Building2,
  FileText,
  Radio,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  UserCheck,
  Trash2,
  ExternalLink,
  DollarSign,
  Globe,
  Copy,
  Check,
  RefreshCw,
  Key,
  ShieldCheck,
  AlertCircle,
  Mail,
} from 'lucide-react';

export const AdminPanelView: React.FC<{
  onNavigateToUser: (userId: string) => void;
}> = ({ onNavigateToUser }) => {
  const { currentUser, profile, isAdmin } = useAuth();
  const { showToast } = useUI();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'users' | 'reports' | 'communities' | 'broadcast' | 'logs' | 'domain' | 'emails'
  >('dashboard');

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalCommunities: 0,
    pendingReports: 0,
    suspendedUsers: 0,
  });

  // Entities
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [communitiesList, setCommunitiesList] = useState<Community[]>([]);
  const [logsList, setLogsList] = useState<AdminLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search in users
  const [userSearch, setUserSearch] = useState('');

  // Broadcast announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'urgent' | 'safety'>('normal');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  // Domain & Google OAuth platform status
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast(`Copiado: ${text}`, 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Fetch admin dashboard data
  useEffect(() => {
    if (!isAdmin) return;
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [uSnap, pSnap, cSnap, rSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), limit(100))),
          getDocs(query(collection(db, 'posts'), limit(100))),
          getDocs(query(collection(db, 'communities'), limit(50))),
          getDocs(query(collection(db, 'reports'), limit(100))),
        ]);

        const users = uSnap.docs.map((d) => d.data() as UserProfile);
        const reports = rSnap.docs.map((d) => d.data() as ReportItem);
        const communities = cSnap.docs.map((d) => d.data() as Community);

        setUsersList(users);
        setReportsList(reports);
        setCommunitiesList(communities);

        const pendingRep = reports.filter((r) => r.status === 'pending');
        const suspended = users.filter((u) => u.isSuspended || u.isBanned);

        setStats({
          totalUsers: users.length,
          totalPosts: pSnap.size,
          totalCommunities: communities.length,
          pendingReports: pendingRep.length,
          suspendedUsers: suspended.length,
        });

        // Fetch logs
        const lSnap = await getDocs(
          query(collection(db, 'adminLogs'), orderBy('createdAt', 'desc'), limit(30))
        );
        setLogsList(lSnap.docs.map((d) => d.data() as AdminLogItem));
      } catch (e) {
        console.warn('Erro ao carregar dados administrativos:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isAdmin]);

  // Log admin action to immutable audit log
  const recordAdminLog = async (
    action: string,
    targetType: string,
    targetId: string,
    details: string
  ) => {
    if (!currentUser) return;
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'adminLogs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: currentUser.email || 'admin@soamizade.com.br',
        action,
        targetType,
        targetId,
        details,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {}
  };

  // Moderate user: Warn, Suspend, Ban, Reactivate
  const handleModerateUser = async (
    targetUser: UserProfile,
    action: 'warn' | 'suspend' | 'ban' | 'reactivate'
  ) => {
    try {
      const userRef = doc(db, 'users', targetUser.id);

      if (action === 'warn') {
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: targetUser.id,
          type: 'warning',
          title: 'Aviso da Moderação SÓ AMIZADE',
          message:
            'Lembramos que o SÓ AMIZADE é estritamente para amizades saudáveis e respeitosas. Propostas românticas, assédio ou desrespeito violam nossos termos.',
          read: false,
          createdAt: new Date().toISOString(),
        });
        await recordAdminLog(
          'EMITIR_ADVERTENCIA',
          'user',
          targetUser.id,
          `Advertência formal enviada para @${targetUser.username}`
        );
        showToast(`Advertência enviada para @${targetUser.username}.`, 'success');
      } else if (action === 'suspend') {
        const reason = prompt('Informe o motivo da suspensão temporária:') || 'Violação das diretrizes';
        await updateDoc(userRef, {
          isSuspended: true,
          suspensionReason: reason,
          updatedAt: new Date().toISOString(),
        });
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isSuspended: true, suspensionReason: reason } : u))
        );
        await recordAdminLog('SUSPENDER_CONTA', 'user', targetUser.id, `Suspensão: ${reason}`);
        showToast(`Conta de @${targetUser.username} suspensa.`);
      } else if (action === 'ban') {
        if (!window.confirm(`Confirma o banimento permanente de @${targetUser.username}?`)) return;
        await updateDoc(userRef, {
          isBanned: true,
          isSuspended: true,
          suspensionReason: 'Banimento permanente por violação grave comprovada.',
          updatedAt: new Date().toISOString(),
        });
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isBanned: true, isSuspended: true } : u))
        );
        await recordAdminLog('BANIR_PERMANENTE', 'user', targetUser.id, 'Banimento permanente');
        showToast(`Usuário @${targetUser.username} banido permanentemente.`);
      } else if (action === 'reactivate') {
        await updateDoc(userRef, {
          isSuspended: false,
          isBanned: false,
          suspensionReason: '',
          updatedAt: new Date().toISOString(),
        });
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isSuspended: false, isBanned: false } : u))
        );
        await recordAdminLog('REATIVAR_CONTA', 'user', targetUser.id, 'Conta reativada pela moderação');
        showToast(`Conta de @${targetUser.username} reativada com sucesso!`, 'success');
      }
    } catch (e) {
      showToast('Erro ao executar ação administrativa.', 'error');
    }
  };

  // Moderate report
  const handleResolveReport = async (
    report: ReportItem,
    resolution: 'resolved' | 'dismissed',
    notes: string
  ) => {
    try {
      const repRef = doc(db, 'reports', report.id);
      await updateDoc(repRef, {
        status: resolution,
        reviewedBy: currentUser?.email || 'admin',
        resolution: notes,
      });

      setReportsList((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, status: resolution, reviewedBy: currentUser?.email || 'admin', resolution: notes }
            : r
        )
      );

      await recordAdminLog(
        resolution === 'resolved' ? 'RESOLVER_DENUNCIA' : 'DESCARTAR_DENUNCIA',
        report.targetType,
        report.targetId,
        `Denúncia ${report.id} avaliada como ${resolution}. Motivo: ${notes}`
      );

      showToast(`Denúncia marcada como ${resolution === 'resolved' ? 'Resolvida' : 'Descartada'}.`);
    } catch (e) {
      showToast('Erro ao atualizar denúncia.', 'error');
    }
  };

  // Delete reported post directly
  const handleDeleteReportedPost = async (postId: string) => {
    if (!window.confirm('Confirma a remoção definitiva deste conteúdo denunciado?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      await recordAdminLog('REMOVER_POST_DENUNCIADO', 'post', postId, 'Remoção de conteúdo infrator');
      showToast('Publicação removida com sucesso!');
    } catch (e) {
      showToast('Erro ao remover conteúdo.', 'error');
    }
  };

  // Broadcast Announcement
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !annTitle.trim() || !annContent.trim()) return;

    setIsBroadcasting(true);
    try {
      const annId = `ann_${Date.now()}`;
      const ann: OfficialAnnouncement = {
        id: annId,
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        authorEmail: currentUser.email || 'diretoria@soamizade.com.br',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'officialAnnouncements', annId), ann);

      // Create a global notification record for all recent users
      const batchList = usersList.slice(0, 30);
      for (const u of batchList) {
        const notifId = `notif_ann_${u.id}_${Date.now()}`;
        try {
          await setDoc(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: u.id,
            type: 'announcement',
            title: `Comunicado Oficial: ${annTitle.trim()}`,
            message: annContent.trim().slice(0, 100),
            link: '/feed',
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {}
      }

      await recordAdminLog('COMUNICADO_OFICIAL', 'broadcast', annId, annTitle.trim());

      setAnnTitle('');
      setAnnContent('');
      showToast('Comunicado oficial publicado para toda a comunidade!', 'success');
    } catch (e) {
      showToast('Erro ao emitir comunicado.', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Access denied guard
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Acesso Restrito</h3>
        <p className="text-xs text-slate-500">
          Esta área é reservada exclusivamente para administradores autorizados do SÓ AMIZADE.
        </p>
      </div>
    );
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Admin Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold tracking-tight">Painel Administrativo</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-500/20 text-teal-300 rounded border border-teal-500/40">
                PRODUÇÃO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gestão de usuários, fila de denúncias, moderação rigorosa e auditoria.
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          <p>
            Conectado como: <strong className="text-white">{currentUser?.email}</strong>
          </p>
          <p className="text-[11px] text-teal-400 font-medium">Permissões de Administrador Geral</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto gap-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Fila de Denúncias ({stats.pendingReports})
          {stats.pendingReports > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
              {stats.pendingReports}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Usuários ({stats.totalUsers})
        </button>
        <button
          onClick={() => setActiveTab('communities')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'communities'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Comunidades ({stats.totalCommunities})
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'broadcast'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Comunicados
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Logs de Auditoria
        </button>
        <button
          onClick={() => setActiveTab('domain')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center space-x-1.5 ${
            activeTab === 'domain'
              ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Identidade & Domínio OAuth</span>
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center space-x-1.5 ${
            activeTab === 'emails'
              ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>E-mails & Suporte</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total de Membros
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {stats.totalUsers}
              </p>
              <span className="text-[11px] text-teal-600 font-medium">Perfis registrados</span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Denúncias Pendentes
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {stats.pendingReports}
              </p>
              <span className="text-[11px] text-slate-400">Fila com prioridade alta</span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Publicações
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {stats.totalPosts}
              </p>
              <span className="text-[11px] text-indigo-500 font-medium">Feed ativo</span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Contas Restritas/Banidas
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {stats.suspendedUsers}
              </p>
              <span className="text-[11px] text-slate-400">Medidas de proteção</span>
            </div>
          </div>

          {/* Quick moderation tips */}
          <div className="p-6 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/40 text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 space-y-2">
            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>Diretrizes de Moderação Sênior</span>
            </h4>
            <p className="text-xs text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed">
              1. Casos de suspeita de menor de 18 anos recebem prioridade máxima de bloqueio imediato até comprovação.
              <br />
              2. Propostas românticas, conotação sexual ou assédio geram advertência e, em reincidência, banimento permanente.
              <br />
              3. Todas as decisões tomadas ficam registradas com carimbo de data/hora nos logs de auditoria.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: REPORTS QUEUE */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reportsList.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <CheckCircle className="w-10 h-10 text-teal-500 mx-auto" />
              <h3 className="font-bold text-base">Fila de moderação limpa!</h3>
              <p className="text-xs text-slate-500">
                Nenhuma denúncia pendente de análise no momento.
              </p>
            </div>
          ) : (
            reportsList.map((rep) => (
              <div
                key={rep.id}
                className={`p-5 rounded-3xl border shadow-sm space-y-3.5 ${
                  rep.status === 'pending'
                    ? 'bg-rose-50/30 dark:bg-rose-950/15 border-rose-200 dark:border-rose-900/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        rep.priority === 'high'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {rep.priority === 'high' ? 'Prioridade Alta' : 'Média'}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Alvo: {rep.targetType.toUpperCase()} ({rep.targetId})
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Reportado em {new Date(rep.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-1 text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-200">
                    Motivo da Denúncia:
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">{rep.reason}</p>
                  {rep.evidence && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                      Evidência: "{rep.evidence}"
                    </p>
                  )}
                  {rep.targetSnapshot && (
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      Snapshot: "{rep.targetSnapshot}"
                    </p>
                  )}
                </div>

                {/* Report Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500">
                    Status: <strong className="capitalize">{rep.status}</strong>
                    {rep.reviewedBy && <span> • Analisado por {rep.reviewedBy}</span>}
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      {rep.targetType === 'post' && (
                        <button
                          onClick={() => handleDeleteReportedPost(rep.targetId)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 transition"
                        >
                          Excluir Publicação
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleResolveReport(rep, 'resolved', 'Medidas disciplinares aplicadas.')
                        }
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition shadow-sm"
                      >
                        Marcar Resolvida
                      </button>
                      <button
                        onClick={() =>
                          handleResolveReport(rep, 'dismissed', 'Sem violação comprovada.')
                        }
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                      >
                        Descartar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Gerenciamento de Membros</h3>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nome, @usuário ou e-mail..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Membro</th>
                  <th className="py-2.5 px-3">E-mail</th>
                  <th className="py-2.5 px-3">Plano</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Ações de Moderação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                          alt={u.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{u.displayName}</p>
                          <p className="text-[11px] text-slate-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 uppercase">
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.isBanned ? (
                        <span className="text-rose-600 font-bold">Banido</span>
                      ) : u.isSuspended ? (
                        <span className="text-amber-600 font-bold">Suspenso</span>
                      ) : (
                        <span className="text-teal-600 font-medium">Ativo</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleModerateUser(u, 'warn')}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-amber-50 text-amber-700 text-[11px] font-semibold"
                        title="Enviar Advertência"
                      >
                        Advertir
                      </button>
                      {u.isSuspended || u.isBanned ? (
                        <button
                          onClick={() => handleModerateUser(u, 'reactivate')}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold"
                        >
                          Reativar
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleModerateUser(u, 'suspend')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                          >
                            Suspender
                          </button>
                          <button
                            onClick={() => handleModerateUser(u, 'ban')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                          >
                            Banir
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COMMUNITIES MANAGEMENT */}
      {activeTab === 'communities' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-base">Comunidades Ativas na Rede</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {communitiesList.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm">{c.name}</h4>
                  <p className="text-xs text-slate-400">
                    {c.category} • {c.memberCount} membros
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Excluir permanentemente a comunidade ${c.name}?`)) return;
                    await deleteDoc(doc(db, 'communities', c.id));
                    setCommunitiesList((prev) => prev.filter((item) => item.id !== c.id));
                    showToast('Comunidade removida com sucesso.');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-500"
                  title="Remover comunidade"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: OFFICIAL BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Radio className="w-5 h-5" />
            <h3 className="font-bold text-base">Emitir Comunicado Oficial da Rede</h3>
          </div>
          <p className="text-xs text-slate-500">
            Esta mensagem será enviada como comunicado institucional oficial para a central de notificações e aparecerá para todos os membros.
          </p>

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Título do Comunicado *</label>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Ex.: Atualização Importante nas Diretrizes de Segurança"
                maxLength={120}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Nível de Prioridade *</label>
              <select
                value={annPriority}
                onChange={(e) => setAnnPriority(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
              >
                <option value="normal">Normal • Novidade</option>
                <option value="safety">Segurança • Diretrizes</option>
                <option value="urgent">Urgente • Comunicado Geral</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Conteúdo da Mensagem *</label>
              <textarea
                required
                rows={4}
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="Escreva a mensagem oficial com clareza e transparência..."
                maxLength={3000}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isBroadcasting || !annTitle.trim() || !annContent.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isBroadcasting ? 'Transmitindo...' : 'Transmitir Comunicado'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-base">Registro Imutável de Auditoria (Audit Logs)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Todas as decisões administrativas e punições ficam registradas de forma auditável e transparente.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Ação</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-3">Alvo</th>
                  <th className="py-2.5 px-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                      Nenhum registro de auditoria arquivado ainda.
                    </td>
                  </tr>
                ) : (
                  logsList.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {log.adminEmail}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{log.targetId}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: DOMAIN & GOOGLE OAUTH BRANDING */}
      {activeTab === 'domain' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              <span>Personalização de Autenticação • login.soamizade.com.br</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Identidade Oficial do Google Auth & Domínio Próprio
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Para trocar o domínio técnico do Google Auth por um domínio próprio, primeiro configure o domínio e os registros DNS no Firebase e no provedor de DNS. O domínio <strong>login.soamizade.com.br</strong> é apenas uma sugestão e ainda não está configurado neste projeto.
            </p>
          </div>

          {/* Real-time Status Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <h4 className="font-bold text-base">Configuração do domínio de autenticação</h4>
              </div>
              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0767997957/authentication/settings"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir configuração no Firebase</span>
              </a>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Domínio Alvo
                </span>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  login.soamizade.com.br
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Status de Propagação DNS
                </span>
                <div className="flex items-center space-x-2">
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Não verificado / não configurado
                    </span>
                  </>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  authDomain em Uso
                </span>
                <p className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">
                  gen-lang-client-0767997957.firebaseapp.com
                </p>
              </div>
            </div>

            {/* Informative alert */}
            <div className="p-4 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 rounded-2xl text-xs text-teal-900 dark:text-teal-200 space-y-1">
              <p className="font-bold flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>O que ainda precisa ser configurado:</span>
              </p>
              <p className="text-[11px] leading-relaxed text-teal-800 dark:text-teal-300">
                O login usa atualmente <strong>gen-lang-client-0767997957.firebaseapp.com</strong>. Um domínio personalizado só poderá ser ativado depois de adicionar o domínio no Firebase Authentication, configurar o DNS e atualizar os domínios autorizados do Google OAuth.
              </p>
            </div>
          </div>

          {/* STEP 1: Google Brand Identity */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="font-bold text-base">Identidade da Marca no Google Auth Platform</h4>
              </div>
              <a
                href="https://console.cloud.google.com/apis/credentials/consent?project=gen-lang-client-0767997957"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-500"
              >
                <span>Abrir Google Cloud Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acesse a <strong>Tela de consentimento OAuth</strong> do projeto Google Cloud <code>gen-lang-client-0767997957</code> e preencha as informações oficiais da marca:
            </p>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Nome do Aplicativo</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">SÓ AMIZADE</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('SÓ AMIZADE', 'appName')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600"
                  title="Copiar"
                >
                  {copiedKey === 'appName' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">E-mail de Suporte</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">tecnomail09@gmail.com</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('tecnomail09@gmail.com', 'supportEmail')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600"
                  title="Copiar"
                >
                  {copiedKey === 'supportEmail' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Página Inicial</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">https://soamizade.com.br</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('https://soamizade.com.br', 'homePage')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600"
                  title="Copiar"
                >
                  {copiedKey === 'homePage' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Política de Privacidade</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">https://soamizade.com.br/privacidade</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('https://soamizade.com.br/privacidade', 'privacyPolicy')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600"
                  title="Copiar"
                >
                  {copiedKey === 'privacyPolicy' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center sm:col-span-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Termos de Serviço</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">https://soamizade.com.br/termos</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('https://soamizade.com.br/termos', 'termsOfService')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600"
                  title="Copiar"
                >
                  {copiedKey === 'termsOfService' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: DNS Records */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-base">Configuração DNS no Registro de Domínio (ex.: Registro.br, Cloudflare)</h4>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              No painel onde o domínio <code>soamizade.com.br</code> foi registrado, crie o registro CNAME apontando para o Firebase Hosting:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Nome / Subdomínio</th>
                    <th className="p-3">Destino / Valor</th>
                    <th className="p-3">TTL</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                  <tr>
                    <td className="p-3 font-bold text-teal-600">CNAME</td>
                    <td className="p-3">login</td>
                    <td className="p-3 text-slate-700 dark:text-slate-200">gen-lang-client-0767997957.web.app</td>
                    <td className="p-3 text-slate-400">Automático / 3600</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleCopy('gen-lang-client-0767997957.web.app', 'cnameTarget')}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600"
                        title="Copiar Destino"
                      >
                        {copiedKey === 'cnameTarget' ? <Check className="w-3.5 h-3.5 text-emerald-500 inline" /> : <Copy className="w-3.5 h-3.5 inline" />}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* STEP 3: Google Cloud OAuth URIs & Firebase Authorized Domains */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-base">Origens e Redirecionamentos Autorizados no Google Cloud</h4>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              No <strong>Google Cloud Console &gt; APIs e Serviços &gt; Credenciais &gt; ID do cliente OAuth 2.0</strong> (Client ID: <code className="font-mono text-[11px]">615861836486-pv0hvg4aov8epfllh2omn0u4drk2ks2u.apps.googleusercontent.com</code>), adicione as seguintes entradas:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Origens JavaScript autorizadas:
                </span>
                <div className="space-y-1.5 font-mono">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span>https://login.soamizade.com.br</span>
                    <button type="button" onClick={() => handleCopy('https://login.soamizade.com.br', 'orig1')} className="p-1 text-slate-400 hover:text-indigo-600">
                      {copiedKey === 'orig1' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span>https://soamizade.com.br</span>
                    <button type="button" onClick={() => handleCopy('https://soamizade.com.br', 'orig2')} className="p-1 text-slate-400 hover:text-indigo-600">
                      {copiedKey === 'orig2' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  URIs de redirecionamento autorizados:
                </span>
                <div className="space-y-1.5 font-mono">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span>https://login.soamizade.com.br/__/auth/handler</span>
                    <button type="button" onClick={() => handleCopy('https://login.soamizade.com.br/__/auth/handler', 'redir1')} className="p-1 text-slate-400 hover:text-indigo-600">
                      {copiedKey === 'redir1' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span>https://gen-lang-client-0767997957.firebaseapp.com/__/auth/handler</span>
                    <button type="button" onClick={() => handleCopy('https://gen-lang-client-0767997957.firebaseapp.com/__/auth/handler', 'redir2')} className="p-1 text-slate-400 hover:text-indigo-600">
                      {copiedKey === 'redir2' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: EMAILS & SUPPORT MANAGEMENT */}
      {activeTab === 'emails' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">E-mail e atendimento</h3>
                <p className="text-xs text-slate-500">Canal oficial: tecnomail09@gmail.com</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
              <p className="font-bold text-sm text-amber-900 dark:text-amber-200">Envio automático ainda não configurado</p>
              <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                A hospedagem do aplicativo não envia e-mails por conta própria. Por isso, o site prepara uma mensagem no aplicativo de e-mail do usuário, mas não afirma que ela foi entregue. Também não há uma caixa de chamados persistente neste painel.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <a href="mailto:tecnomail09@gmail.com?subject=Suporte%20S%C3%93%20AMIZADE" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-4 py-3">
                <Mail className="w-4 h-4" />
                Escrever para o suporte
              </a>
              <a href="https://console.firebase.google.com/project/gen-lang-client-0767997957/authentication/templates" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-3">
                <ExternalLink className="w-4 h-4" />
                Configurar modelos do Firebase
              </a>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              A recuperação de senha utiliza o e-mail nativo do Firebase Authentication. Para boas-vindas, suporte automático e confirmações de exclusão, será necessário conectar um provedor de e-mail transacional em uma função de servidor protegida.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
