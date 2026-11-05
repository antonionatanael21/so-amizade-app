import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { UserProfile, Post, Community } from '../types';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  UserPlus,
  MessageSquare,
  Edit3,
  Ban,
  Flag,
  Film,
  Tv,
  Music,
  Gamepad2,
  Users,
  Building2,
  Check,
  X,
  Lock,
} from 'lucide-react';

interface ProfileViewProps {
  userId?: string;
  onStartChat: (userId: string) => void;
  onNavigateToCommunity: (communityId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  onStartChat,
  onNavigateToCommunity,
}) => {
  const { currentUser, profile: myProfile, updateProfileData, isAdmin } = useAuth();
  const { showToast, openReportModal } = useUI();

  const targetId = userId || currentUser?.uid;
  const isOwnProfile = targetId === currentUser?.uid;

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userFriends, setUserFriends] = useState<UserProfile[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // Active sub-tab: posts, friends, communities
  const [activeTab, setActiveTab] = useState<'posts' | 'friends' | 'communities'>('posts');

  // Friendship status with target user
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Edit profile modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [editCoverURL, setEditCoverURL] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editMovies, setEditMovies] = useState('');
  const [editMusic, setEditMusic] = useState('');
  const [editGames, setEditGames] = useState('');

  useEffect(() => {
    if (!targetId) return;
    const fetchFullProfile = async () => {
      setLoading(true);
      try {
        // Fetch target user doc
        const userSnap = await getDoc(doc(db, 'users', targetId));
        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          setProfileData(data);

          // Populate edit form defaults if own profile
          if (isOwnProfile) {
            setEditDisplayName(data.displayName || '');
            setEditBio(data.bio || '');
            setEditCity(data.city || '');
            setEditState(data.state || '');
            setEditPhotoURL(data.photoURL || '');
            setEditCoverURL(data.coverURL || '');
            setEditInterests(data.interests || []);
            setEditMovies(data.favoriteMovies || '');
            setEditMusic(data.favoriteMusic || '');
            setEditGames(data.favoriteGames || '');
          }
        }

        // Fetch posts created by this user
        const postsSnap = await getDocs(
          query(collection(db, 'posts'), where('authorId', '==', targetId))
        );
        setUserPosts(postsSnap.docs.map((d) => d.data() as Post));

        // Check friendship status if not own profile
        if (!isOwnProfile && currentUser) {
          const f1 = await getDoc(doc(db, 'friendships', `${currentUser.uid}_${targetId}`));
          const f2 = await getDoc(doc(db, 'friendships', `${targetId}_${currentUser.uid}`));
          setIsFriend(f1.exists() || f2.exists());

          const r1 = await getDoc(doc(db, 'friendRequests', `req_${currentUser.uid}_${targetId}`));
          setHasPendingRequest(r1.exists());

          const b1 = await getDoc(doc(db, 'blockedUsers', `${currentUser.uid}_${targetId}`));
          setIsBlocked(b1.exists());
        }

        // Fetch user communities
        const memSnap = await getDocs(
          query(collection(db, 'communities'), where('creatorId', '==', targetId))
        );
        setUserCommunities(memSnap.docs.map((d) => d.data() as Community));
      } catch (err) {
        console.warn('Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullProfile();
  }, [targetId, currentUser, isOwnProfile]);

  const handleSendRequest = async () => {
    if (!currentUser || !myProfile || !profileData) return;
    try {
      const reqId = `req_${currentUser.uid}_${profileData.id}`;
      await setDoc(doc(db, 'friendRequests', reqId), {
        id: reqId,
        senderId: currentUser.uid,
        senderName: myProfile.displayName,
        senderUsername: myProfile.username,
        senderPhotoURL: myProfile.photoURL,
        receiverId: profileData.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setHasPendingRequest(true);
      showToast('Solicitação de amizade enviada!', 'success');
    } catch (e) {
      showToast('Erro ao enviar pedido.', 'error');
    }
  };

  const handleBlockUser = async () => {
    if (!currentUser || !profileData) return;
    if (!window.confirm(`Tem certeza de que deseja bloquear @${profileData.username}? Você não verá mais suas mensagens e interações.`)) {
      return;
    }
    try {
      const blockId = `${currentUser.uid}_${profileData.id}`;
      await setDoc(doc(db, 'blockedUsers', blockId), {
        id: blockId,
        userId: currentUser.uid,
        blockedUserId: profileData.id,
        createdAt: new Date().toISOString(),
      });
      setIsBlocked(true);
      showToast(`Usuário @${profileData.username} bloqueado.`);
    } catch (e) {
      showToast('Falha ao bloquear.', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileData({
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        photoURL: editPhotoURL.trim() || undefined,
        coverURL: editCoverURL.trim() || undefined,
        favoriteMovies: editMovies.trim() || undefined,
        favoriteMusic: editMusic.trim() || undefined,
        favoriteGames: editGames.trim() || undefined,
      });
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              displayName: editDisplayName.trim(),
              bio: editBio.trim(),
              city: editCity.trim(),
              state: editState.trim(),
              photoURL: editPhotoURL.trim() || prev.photoURL,
              coverURL: editCoverURL.trim() || prev.coverURL,
              favoriteMovies: editMovies.trim(),
              favoriteMusic: editMusic.trim(),
              favoriteGames: editGames.trim(),
            }
          : null
      );
      setIsEditing(false);
      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (e) {
      showToast('Erro ao atualizar perfil.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 mt-4">Carregando perfil...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-lg mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-lg">Usuário não encontrado</h3>
        <p className="text-xs text-slate-500 mt-1">Este perfil pode ter sido desativado ou não existe.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Cover & Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cover image banner */}
        <div className="relative h-48 sm:h-64 w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-teal-900">
          {profileData.coverURL && (
            <img
              src={profileData.coverURL}
              alt="Capa do Perfil"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Profile info section */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 gap-4">
            {/* Avatar & Badges */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-3 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
              <div className="relative">
                <img
                  src={profileData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`}
                  alt={profileData.displayName}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl bg-slate-100 dark:bg-slate-800"
                />
                <span className="absolute bottom-1 right-1 p-1 bg-teal-600 text-white rounded-full text-[10px] font-bold shadow" title="Idade 18+ Verificada">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {profileData.displayName}
                  </h2>
                  {profileData.plan === 'plus' && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-300 dark:border-amber-700">
                      SÓ AMIZADE+
                    </span>
                  )}
                  {profileData.role === 'admin' && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-lg">
                      Fundador / Moderação
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">@{profileData.username}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar Perfil</span>
                </button>
              ) : (
                <>
                  {isFriend ? (
                    <button
                      onClick={() => onStartChat(profileData.id)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold shadow-md transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Conversar</span>
                    </button>
                  ) : hasPendingRequest ? (
                    <span className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                      Pedido Pendente
                    </span>
                  ) : (
                    <button
                      onClick={handleSendRequest}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Adicionar Amigo</span>
                    </button>
                  )}

                  <button
                    onClick={() =>
                      openReportModal('user', profileData.id, profileData.id, `@${profileData.username}`)
                    }
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition"
                    title="Denunciar perfil"
                  >
                    <Flag className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleBlockUser}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
                    title="Bloquear usuário"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bio text */}
          <p className="text-sm text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed whitespace-pre-line">
            {profileData.bio || 'Membro do SÓ AMIZADE pronto para construir amizades verdadeiras.'}
          </p>

          {/* Location & Join date metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {(profileData.city || profileData.state) && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>
                  {profileData.city}
                  {profileData.city && profileData.state ? ', ' : ''}
                  {profileData.state}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>
                Membro desde{' '}
                {new Date(profileData.createdAt || Date.now()).toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <span>Maior de 18 anos verificado</span>
            </div>
          </div>

          {/* Favorite media and topics showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            {profileData.favoriteMovies && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                  <Film className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Filmes & Séries</span>
                </span>
                <p className="text-slate-800 dark:text-slate-200 truncate">{profileData.favoriteMovies}</p>
              </div>
            )}
            {profileData.favoriteMusic && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                  <Music className="w-3.5 h-3.5 text-rose-500" />
                  <span>Músicas & Artistas</span>
                </span>
                <p className="text-slate-800 dark:text-slate-200 truncate">{profileData.favoriteMusic}</p>
              </div>
            )}
            {profileData.favoriteGames && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-teal-500" />
                  <span>Jogos & Hobbies</span>
                </span>
                <p className="text-slate-800 dark:text-slate-200 truncate">{profileData.favoriteGames}</p>
              </div>
            )}
          </div>

          {/* Interest Chips */}
          {profileData.interests && profileData.interests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Interesses & Afinidades
              </span>
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'posts'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Publicações ({userPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('communities')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'communities'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Comunidades ({userCommunities.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400 italic">Nenhuma publicação feita ainda por este membro.</p>
            </div>
          ) : (
            userPosts.map((post) => (
              <div
                key={post.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <time>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</time>
                  <span>{post.likesCount} reações</span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
                {post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt="Mídia"
                    className="rounded-2xl max-h-72 w-full object-cover mt-2"
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'communities' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {userCommunities.length === 0 ? (
            <div className="col-span-2 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400 italic">Ainda não criou nenhuma comunidade.</p>
            </div>
          ) : (
            userCommunities.map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigateToCommunity(c.id)}
                className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition flex items-center space-x-3"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white font-bold flex items-center justify-center flex-shrink-0">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{c.name}</h4>
                  <p className="text-xs text-slate-500 truncate">{c.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg">Editar Perfil</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nome de Exibição</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Biografia</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Link da Imagem de Capa (URL)</label>
                <input
                  type="url"
                  value={editCoverURL}
                  onChange={(e) => setEditCoverURL(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Filmes & Séries Favoritas</label>
                <input
                  type="text"
                  value={editMovies}
                  onChange={(e) => setEditMovies(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Músicas ou Artistas</label>
                <input
                  type="text"
                  value={editMusic}
                  onChange={(e) => setEditMusic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
