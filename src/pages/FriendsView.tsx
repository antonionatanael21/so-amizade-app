import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { FriendRequest, Friendship, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  MessageSquare,
  Search,
  Sparkles,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface FriendsViewProps {
  onStartChat: (userId: string) => void;
  onNavigateToProfile: (userId: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  onStartChat,
  onNavigateToProfile,
}) => {
  const { currentUser, profile } = useAuth();
  const { showToast } = useUI();

  const [tab, setTab] = useState<'friends' | 'received' | 'sent'>('friends');
  const [friendsList, setFriendsList] = useState<UserProfile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Load received and sent friend requests
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    // Received requests
    const qRec = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsubRec = onSnapshot(qRec, (snap) => {
      setReceivedRequests(snap.docs.map((d) => d.data() as FriendRequest));
    });

    // Sent requests
    const qSent = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsubSent = onSnapshot(qSent, (snap) => {
      setSentRequests(snap.docs.map((d) => d.data() as FriendRequest));
    });

    // Load active friends list
    const fetchFriends = async () => {
      try {
        const q1 = query(
          collection(db, 'friendships'),
          where('user1Id', '==', currentUser.uid),
          where('status', '==', 'active')
        );
        const q2 = query(
          collection(db, 'friendships'),
          where('user2Id', '==', currentUser.uid),
          where('status', '==', 'active')
        );

        const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const friendIds = new Set<string>();
        s1.forEach((d) => friendIds.add(d.data().user2Id));
        s2.forEach((d) => friendIds.add(d.data().user1Id));

        const profiles: UserProfile[] = [];
        for (const fId of friendIds) {
          const userSnap = await getDoc(doc(db, 'users', fId));
          if (userSnap.exists()) {
            profiles.push(userSnap.data() as UserProfile);
          }
        }
        setFriendsList(profiles);
      } catch (e) {
        console.warn('Erro ao carregar lista de amigos:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();

    return () => {
      unsubRec();
      unsubSent();
    };
  }, [currentUser]);

  // Accept request
  const handleAcceptRequest = async (req: FriendRequest) => {
    if (!currentUser || !profile) return;
    try {
      // 1. Create friendship record
      const friendshipId = `${req.senderId}_${currentUser.uid}`;
      await setDoc(doc(db, 'friendships', friendshipId), {
        id: friendshipId,
        user1Id: req.senderId,
        user2Id: currentUser.uid,
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      // 2. Update request status to accepted
      await updateDoc(doc(db, 'friendRequests', req.id), {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });

      // 3. Send notification to the sender
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: req.senderId,
        senderId: currentUser.uid,
        senderName: profile.displayName,
        senderPhotoURL: profile.photoURL,
        type: 'friend_accept',
        title: 'Pedido de amizade aceito!',
        message: `${profile.displayName} aceitou sua solicitação. Agora vocês são amigos!`,
        link: '/mensagens',
        read: false,
        createdAt: new Date().toISOString(),
      });

      showToast(`Você e ${req.senderName} agora são amigos!`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `friendRequests/${req.id}`);
      showToast('Erro ao aceitar pedido.', 'error');
    }
  };

  // Reject request
  const handleRejectRequest = async (reqId: string) => {
    try {
      await updateDoc(doc(db, 'friendRequests', reqId), {
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      });
      showToast('Solicitação recusada.');
    } catch (e) {
      showToast('Erro ao recusar pedido.', 'error');
    }
  };

  // Cancel sent request
  const handleCancelRequest = async (reqId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', reqId));
      showToast('Solicitação cancelada.');
    } catch (e) {
      showToast('Erro ao cancelar solicitação.', 'error');
    }
  };

  // Remove friendship
  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!currentUser) return;
    if (!window.confirm(`Tem certeza de que deseja desfazer a amizade com ${friendName}?`)) return;

    try {
      const f1 = doc(db, 'friendships', `${currentUser.uid}_${friendId}`);
      const f2 = doc(db, 'friendships', `${friendId}_${currentUser.uid}`);
      await Promise.all([deleteDoc(f1), deleteDoc(f2)]);

      setFriendsList((prev) => prev.filter((u) => u.id !== friendId));
      showToast('Amizade desfeita.');
    } catch (e) {
      showToast('Erro ao remover amigo.', 'error');
    }
  };

  const filteredFriends = friendsList.filter(
    (f) =>
      f.displayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.username.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header and Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Amigos & Solicitações</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Gerencie seus laços de amizade e conexões aceitas na plataforma.
            </p>
          </div>

          {/* Subtabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setTab('friends')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                tab === 'friends'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Meus Amigos ({friendsList.length})
            </button>
            <button
              onClick={() => setTab('received')}
              className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                tab === 'received'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Recebidos ({receivedRequests.length})
              {receivedRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
                  {receivedRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('sent')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                tab === 'sent'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Enviados ({sentRequests.length})
            </button>
          </div>
        </div>

        {/* Search within friends list */}
        {tab === 'friends' && friendsList.length > 0 && (
          <div className="relative pt-2">
            <Search className="absolute left-3.5 top-5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar entre seus amigos..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: FRIENDS LIST */}
      {tab === 'friends' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Carregando lista de amigos...</div>
          ) : filteredFriends.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Users className="w-10 h-10 text-indigo-400 mx-auto" />
              <h3 className="font-bold text-base">Você ainda não possui amigos adicionados</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Visite a página <strong>Descobrir</strong> para encontrar pessoas com gostos parecidos e enviar suas primeiras solicitações.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
                >
                  <div
                    onClick={() => onNavigateToProfile(friend.id)}
                    className="flex items-center space-x-3 cursor-pointer min-w-0"
                  >
                    <img
                      src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                      alt={friend.displayName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {friend.displayName}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">@{friend.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onStartChat(friend.id)}
                      className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition shadow-sm"
                      title="Enviar Mensagem Privada"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id, friend.displayName)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition"
                      title="Desfazer Amizade"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECEIVED REQUESTS */}
      {tab === 'received' && (
        <div className="space-y-4">
          {receivedRequests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Check className="w-10 h-10 text-teal-500 mx-auto" />
              <h3 className="font-bold text-base">Nenhuma solicitação pendente</h3>
              <p className="text-xs text-slate-500">
                Quando outros membros enviarem pedidos de amizade para você, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div
                    onClick={() => onNavigateToProfile(req.senderId)}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <img
                      src={req.senderPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.senderId}`}
                      alt={req.senderName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {req.senderName}
                      </h4>
                      <p className="text-xs text-slate-400">@{req.senderUsername}</p>
                      <time className="text-[10px] text-slate-400">
                        Enviado em {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                      </time>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aceitar Amizade</span>
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SENT REQUESTS */}
      {tab === 'sent' && (
        <div className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Clock className="w-10 h-10 text-indigo-400 mx-auto" />
              <h3 className="font-bold text-base">Nenhuma solicitação enviada pendente</h3>
              <p className="text-xs text-slate-500">
                Você não possui pedidos de amizade aguardando resposta.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
                >
                  <div
                    onClick={() => onNavigateToProfile(req.receiverId)}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                      AM
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Pedido de Amizade Enviado
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Aguardando confirmação do membro
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelRequest(req.id)}
                    className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition"
                  >
                    Cancelar Pedido
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
