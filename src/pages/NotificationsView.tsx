import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { NotificationItem } from '../types';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  Bell,
  CheckCheck,
  UserPlus,
  Heart,
  MessageCircle,
  Building2,
  ShieldAlert,
  ArrowRight,
  Trash2,
} from 'lucide-react';

interface NotificationsViewProps {
  onNavigate: (route: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { showToast } = useUI();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => d.data() as NotificationItem);
          setNotifications(list);
          setLoading(false);
        },
        () => setLoading(false)
      );

      return () => unsub();
    } catch (e) {
      setLoading(false);
    }
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.read) {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        }
      });
      await batch.commit();
      showToast('Todas as notificações foram marcadas como lidas.');
    } catch (e) {
      showToast('Erro ao atualizar notificações.', 'error');
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { read: true });
      } catch (e) {}
    }
    if (notif.link) {
      const cleanRoute = notif.link.replace(/^\//, '');
      onNavigate(cleanRoute);
    }
  };

  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accept':
        return <UserPlus className="w-5 h-5 text-teal-500" />;
      case 'reaction':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-indigo-500" />;
      case 'community':
        return <Building2 className="w-5 h-5 text-amber-500" />;
      case 'warning':
      case 'announcement':
        return <ShieldAlert className="w-5 h-5 text-violet-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Central de Notificações</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Acompanhe interações de amigos, comentários e novidades.
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Marcar lidas</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Carregando notificações...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Bell className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-bold text-base">Nenhuma notificação por enquanto</h3>
          <p className="text-xs text-slate-500">
            Quando outros amigos interagirem com você, avisaremos aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start space-x-3.5 ${
                notif.read
                  ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/60 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex-shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm">{notif.title}</h4>
                  <time className="text-[10px] text-slate-400">
                    {new Date(notif.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                  {notif.message}
                </p>
              </div>

              <button
                onClick={(e) => handleDeleteNotif(notif.id, e)}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                title="Excluir notificação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
