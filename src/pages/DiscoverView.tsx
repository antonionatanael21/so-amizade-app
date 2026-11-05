import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { UserProfile, FriendRequest } from '../types';
import { calculateCommonInterests } from '../utils/validation';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  collection,
  query,
  limit,
  getDocs,
  where,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  Search,
  Filter,
  UserPlus,
  Check,
  MapPin,
  Sparkles,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

const POPULAR_INTEREST_FILTERS = [
  'Todos',
  'Cinema & Séries',
  'Leitura & Livros',
  'Tecnologia',
  'Games & E-sports',
  'Música & Shows',
  'Culinária & Café',
  'Viagens & Trilhas',
  'Fotografia',
  'Esportes & Fitness',
];

interface DiscoverViewProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onNavigateToProfile: (userId: string) => void;
  onStartChat: (userId: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  searchQuery,
  setSearchQuery,
  onNavigateToProfile,
  onStartChat,
}) => {
  const { currentUser, profile } = useAuth();
  const { showToast } = useUI();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterest, setSelectedInterest] = useState('Todos');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [onlyCommonInterests, setOnlyCommonInterests] = useState(false);

  // Tracks friend requests and existing friendships for UI state
  const [sentRequestMap, setSentRequestMap] = useState<Record<string, string>>({}); // targetUserId -> requestId
  const [friendshipUserIds, setFriendshipUserIds] = useState<Set<string>>(new Set());

  // Load sent requests
  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      const unsub = onSnapshot(q, (snap) => {
        const map: Record<string, string> = {};
        snap.forEach((d) => {
          const data = d.data();
          map[data.receiverId] = d.id;
        });
        setSentRequestMap(map);
      });
      return () => unsub();
    } catch (e) {}
  }, [currentUser]);

  // Load active friendships
  useEffect(() => {
    if (!currentUser) return;
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

      const un1 = onSnapshot(q1, (snap) => {
        setFriendshipUserIds((prev) => {
          const next = new Set(prev);
          snap.forEach((d) => next.add(d.data().user2Id));
          return next;
        });
      });
      const un2 = onSnapshot(q2, (snap) => {
        setFriendshipUserIds((prev) => {
          const next = new Set(prev);
          snap.forEach((d) => next.add(d.data().user1Id));
          return next;
        });
      });
      return () => {
        un1();
        un2();
      };
    } catch (e) {}
  }, [currentUser]);

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'users'), limit(60)));
        const list: UserProfile[] = [];
        snap.forEach((d) => {
          const u = d.data() as UserProfile;
          if (u.id !== currentUser?.uid && !u.isSuspended && !u.isBanned) {
            list.push(u);
          }
        });
        setUsers(list);
      } catch (err) {
        console.warn('Erro ao carregar usuários:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUser]);

  // Send friend request
  const handleSendFriendRequest = async (targetUser: UserProfile) => {
    if (!currentUser || !profile) return;
    try {
      const reqId = `req_${currentUser.uid}_${targetUser.id}`;
      const newReq: FriendRequest = {
        id: reqId,
        senderId: currentUser.uid,
        senderName: profile.displayName,
        senderUsername: profile.username,
        senderPhotoURL: profile.photoURL,
        receiverId: targetUser.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'friendRequests', reqId), newReq);

      // Create notification for target user
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: targetUser.id,
        senderId: currentUser.uid,
        senderName: profile.displayName,
        senderPhotoURL: profile.photoURL,
        type: 'friend_request',
        title: 'Novo pedido de amizade',
        message: `${profile.displayName} (@${profile.username}) enviou uma solicitação de amizade para você.`,
        link: '/amigos',
        read: false,
        createdAt: new Date().toISOString(),
      });

      showToast(`Solicitação enviada para ${targetUser.displayName}!`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'friendRequests');
      showToast('Falha ao enviar pedido de amizade.', 'error');
    }
  };

  // Cancel sent friend request
  const handleCancelRequest = async (targetUserId: string) => {
    const reqId = sentRequestMap[targetUserId];
    if (!reqId) return;
    try {
      await deleteDoc(doc(db, 'friendRequests', reqId));
      showToast('Solicitação cancelada.');
    } catch (e) {
      showToast('Erro ao cancelar solicitação.', 'error');
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.displayName?.toLowerCase().includes(q);
      const matchUser = u.username?.toLowerCase().includes(q);
      const matchBio = u.bio?.toLowerCase().includes(q);
      const matchInterest = u.interests?.some((i) => i.toLowerCase().includes(q));
      if (!matchName && !matchUser && !matchBio && !matchInterest) return false;
    }

    // Category filter
    if (selectedInterest !== 'Todos') {
      if (!u.interests?.includes(selectedInterest)) return false;
    }

    // City & State filters
    if (cityFilter.trim() && !u.city?.toLowerCase().includes(cityFilter.toLowerCase().trim())) {
      return false;
    }
    if (stateFilter.trim() && u.state?.toLowerCase() !== stateFilter.toLowerCase().trim()) {
      return false;
    }

    // Only with common interests
    if (onlyCommonInterests) {
      const common = calculateCommonInterests(profile?.interests || [], u.interests || []);
      if (common.length === 0) return false;
    }

    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header and Welcome */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Descoberta de Amigos Reais</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Descubra pessoas com quem você se identifica
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200">
            Filtre por afinidades, hobbies ou localização. Sem deslizar perfis: aqui cada conexão começa com respeito e interesses verdadeiros.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Text search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, @usuário, hobby ou assunto..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Location filter */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Cidade"
              className="w-2/3 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value.toUpperCase())}
              placeholder="UF"
              maxLength={2}
              className="w-1/3 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 uppercase text-center"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {POPULAR_INTEREST_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedInterest(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedInterest === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Toggle: Apenas interesses em comum */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyCommonInterests}
              onChange={(e) => setOnlyCommonInterests(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Apenas pessoas com afinidades em comum com meu perfil</span>
          </label>
          <span className="text-[11px] text-slate-400">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'membro encontrado' : 'membros encontrados'}
          </span>
        </div>
      </div>

      {/* Users Discovery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse"
            >
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto" />
              <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="font-bold text-base">Nenhum membro encontrado com estes filtros</h3>
          <p className="text-xs text-slate-500">
            Tente remover alguns filtros ou buscar por termos mais abrangentes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredUsers.map((targetUser) => {
            const isFriend = friendshipUserIds.has(targetUser.id);
            const isPending = !!sentRequestMap[targetUser.id];
            const commonInterests = calculateCommonInterests(
              profile?.interests || [],
              targetUser.interests || []
            );

            return (
              <div
                key={targetUser.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  {/* Avatar & Header */}
                  <div className="flex items-start space-x-3.5">
                    <img
                      src={targetUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.id}`}
                      alt={targetUser.displayName}
                      onClick={() => onNavigateToProfile(targetUser.id)}
                      className="w-14 h-14 rounded-full object-cover cursor-pointer ring-2 ring-indigo-500/20 hover:scale-105 transition duration-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <h4
                          onClick={() => onNavigateToProfile(targetUser.id)}
                          className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 hover:underline cursor-pointer truncate"
                        >
                          {targetUser.displayName}
                        </h4>
                        {targetUser.plan === 'plus' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded border border-amber-300">
                            PLUS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">@{targetUser.username}</p>

                      {(targetUser.city || targetUser.state) && (
                        <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 text-teal-600" />
                          <span>
                            {targetUser.city}
                            {targetUser.city && targetUser.state ? ', ' : ''}
                            {targetUser.state}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Common interests highlight badge */}
                  {commonInterests.length > 0 && (
                    <div className="mt-3 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-[11px] font-semibold text-teal-800 dark:text-teal-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span>
                        {commonInterests.length} {commonInterests.length === 1 ? 'interesse em comum:' : 'interesses em comum:'}{' '}
                        <strong>{commonInterests.slice(0, 3).join(', ')}</strong>
                      </span>
                    </div>
                  )}

                  {/* Bio snippet */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                    {targetUser.bio || 'Membro do SÓ AMIZADE pronto para conversar e trocar afinidades.'}
                  </p>

                  {/* Interest chips */}
                  {targetUser.interests && targetUser.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {targetUser.interests.slice(0, 4).map((i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400"
                        >
                          {i}
                        </span>
                      ))}
                      {targetUser.interests.length > 4 && (
                        <span className="text-[10px] text-slate-400">
                          +{targetUser.interests.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action buttons */}
                <div className="flex items-center space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onNavigateToProfile(targetUser.id)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition text-center"
                  >
                    Ver Perfil
                  </button>

                  {isFriend ? (
                    <button
                      onClick={() => onStartChat(targetUser.id)}
                      className="flex items-center space-x-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Mensagem</span>
                    </button>
                  ) : isPending ? (
                    <button
                      onClick={() => handleCancelRequest(targetUser.id)}
                      className="py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition"
                      title="Clique para cancelar pedido"
                    >
                      Pedido Enviado
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendFriendRequest(targetUser)}
                      className="flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Adicionar Amigo</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
