import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Community, Post } from '../types';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  collection,
  query,
  limit,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  increment,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  Building2,
  Plus,
  Users,
  Search,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Send,
  Flag,
  BookOpen,
} from 'lucide-react';

const COMMUNITY_CATEGORIES = [
  'Todas',
  'Cinema & Entretenimento',
  'Leitura & Literatura',
  'Tecnologia & Ciência',
  'Games & E-sports',
  'Música & Artes',
  'Culinária & Café',
  'Amizades Regionais',
  'Conversas do Dia a Dia',
];

export const CommunitiesView: React.FC<{
  selectedCommunityId?: string | null;
  onNavigateToCommunity: (id: string) => void;
  onBackToList: () => void;
}> = ({ selectedCommunityId, onNavigateToCommunity, onBackToList }) => {
  const { currentUser, profile } = useAuth();
  const { showToast, openReportModal } = useUI();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchFilter, setSearchFilter] = useState('');

  // Create community modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commName, setCommName] = useState('');
  const [commSlug, setCommSlug] = useState('');
  const [commCategory, setCommCategory] = useState('Cinema & Entretenimento');
  const [commDesc, setCommDesc] = useState('');
  const [commRules, setCommRules] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Active community detail states
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [isPostingInCommunity, setIsPostingInCommunity] = useState(false);

  // Load communities list
  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'communities'), limit(50)));
        const list = snap.docs.map((d) => d.data() as Community);
        setCommunities(list);

        // If default communities are empty, seed the initial official communities
        if (list.length === 0 && currentUser) {
          await seedDefaultCommunities();
        }
      } catch (e) {
        console.warn('Erro ao buscar comunidades:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, [currentUser]);

  // Seed default thematic communities if none exist
  const seedDefaultCommunities = async () => {
    const defaults = [
      {
        id: 'comm_cinema',
        name: 'Clube dos Cinéfilos & Séries',
        slug: 'cinema-e-series',
        category: 'Cinema & Entretenimento',
        description: 'Debates respeitosos sobre grandes filmes, lançamentos, clássicos e indicações.',
        rules: 'Sem spoilers sem aviso. Respeito às diferentes opiniões artísticas.',
        memberCount: 14,
        postCount: 5,
      },
      {
        id: 'comm_livros',
        name: 'Café Literário & Livros',
        slug: 'cafe-literario',
        category: 'Leitura & Literatura',
        description: 'Compartilhamento de leituras do mês, poemas, ficção científica e não-ficção.',
        rules: 'Foco em literatura e discussões edificantes.',
        memberCount: 22,
        postCount: 8,
      },
      {
        id: 'comm_tecnologia',
        name: 'Tecnologia, Inovação & Código',
        slug: 'tecnologia-e-codigo',
        category: 'Tecnologia & Ciência',
        description: 'Para entusiastas de inovação, inteligência artificial, programação e gadgets.',
        rules: 'Troca de conhecimento sem prepotência.',
        memberCount: 19,
        postCount: 7,
      },
      {
        id: 'comm_nordeste',
        name: 'Amizades do Nordeste & Brasil',
        slug: 'amizades-brasil',
        category: 'Amizades Regionais',
        description: 'Conectando pessoas de Recife, Salvador, Fortaleza, Natal e todo o país.',
        rules: 'Ambiente amistoso e acolhedor.',
        memberCount: 35,
        postCount: 12,
      },
    ];

    for (const item of defaults) {
      await setDoc(doc(db, 'communities', item.id), {
        ...item,
        creatorId: currentUser?.uid || 'admin',
        creatorName: 'Equipe SÓ AMIZADE',
        createdAt: new Date().toISOString(),
      });
    }

    const snap = await getDocs(query(collection(db, 'communities'), limit(50)));
    setCommunities(snap.docs.map((d) => d.data() as Community));
  };

  // Load single community detail if selected
  useEffect(() => {
    if (!selectedCommunityId) {
      setActiveCommunity(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        const commSnap = await getDoc(doc(db, 'communities', selectedCommunityId));
        if (commSnap.exists()) {
          const data = commSnap.data() as Community;
          setActiveCommunity(data);

          // Check membership
          if (currentUser) {
            const memSnap = await getDoc(
              doc(db, 'communities', selectedCommunityId, 'members', currentUser.uid)
            );
            setIsMember(memSnap.exists());
          }

          // Listen to community posts
          const q = query(
            collection(db, 'posts'),
            where('communityId', '==', selectedCommunityId),
            limit(30)
          );
          onSnapshot(q, (snapshot) => {
            setCommunityPosts(snapshot.docs.map((d) => d.data() as Post));
          });
        }
      } catch (e) {
        console.warn('Erro ao carregar detalhes da comunidade:', e);
      }
    };

    fetchDetail();
  }, [selectedCommunityId, currentUser]);

  // Handle Create Community
  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;
    if (!commName.trim() || !commSlug.trim()) return;

    setIsCreating(true);
    try {
      const commId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const cleanSlug = commSlug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-');

      const newComm: Community = {
        id: commId,
        name: commName.trim(),
        slug: cleanSlug,
        category: commCategory,
        description: commDesc.trim(),
        rules: commRules.trim() || 'Respeito e amizade sempre em primeiro lugar.',
        creatorId: currentUser.uid,
        creatorName: profile.displayName,
        memberCount: 1,
        postCount: 0,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'communities', commId), newComm);
      // Add creator as member
      await setDoc(doc(db, 'communities', commId, 'members', currentUser.uid), {
        id: currentUser.uid,
        communityId: commId,
        userId: currentUser.uid,
        role: 'admin',
        joinedAt: new Date().toISOString(),
      });

      setCommunities((prev) => [newComm, ...prev]);
      setShowCreateModal(false);
      setCommName('');
      setCommSlug('');
      setCommDesc('');
      setCommRules('');
      showToast('Comunidade criada com sucesso!', 'success');
      onNavigateToCommunity(commId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'communities');
      showToast('Erro ao criar comunidade.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Join or Leave community
  const handleToggleMembership = async () => {
    if (!currentUser || !activeCommunity) return;
    const memRef = doc(db, 'communities', activeCommunity.id, 'members', currentUser.uid);
    const commRef = doc(db, 'communities', activeCommunity.id);

    try {
      if (isMember) {
        await deleteDoc(memRef);
        await updateDoc(commRef, { memberCount: increment(-1) });
        setIsMember(false);
        setActiveCommunity((prev) =>
          prev ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) } : null
        );
        showToast(`Você saiu da comunidade ${activeCommunity.name}.`);
      } else {
        await setDoc(memRef, {
          id: currentUser.uid,
          communityId: activeCommunity.id,
          userId: currentUser.uid,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });
        await updateDoc(commRef, { memberCount: increment(1) });
        setIsMember(true);
        setActiveCommunity((prev) =>
          prev ? { ...prev, memberCount: prev.memberCount + 1 } : null
        );
        showToast(`Bem-vindo(a) à comunidade ${activeCommunity.name}!`, 'success');
      }
    } catch (e) {
      showToast('Falha ao atualizar participação.', 'error');
    }
  };

  // Post inside community
  const handlePostInCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile || !activeCommunity || !newPostText.trim()) return;

    setIsPostingInCommunity(true);
    try {
      const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const post: Post = {
        id: postId,
        authorId: currentUser.uid,
        authorName: profile.displayName,
        authorUsername: profile.username,
        authorPhotoURL: profile.photoURL,
        content: newPostText.trim(),
        communityId: activeCommunity.id,
        communityName: activeCommunity.name,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'posts', postId), post);
      await updateDoc(doc(db, 'communities', activeCommunity.id), {
        postCount: increment(1),
      });

      setNewPostText('');
      showToast('Publicado na comunidade!', 'success');
    } catch (e) {
      showToast('Erro ao publicar.', 'error');
    } finally {
      setIsPostingInCommunity(false);
    }
  };

  // Filtered communities
  const filteredCommunities = communities.filter((c) => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedCategory !== 'Todas') {
      if (c.category !== selectedCategory) return false;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* If viewing a single community */}
      {activeCommunity ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-indigo-900 to-teal-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <button
                  onClick={onBackToList}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                  aria-label="Voltar para a lista de comunidades"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl font-bold">
                  {activeCommunity.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold">{activeCommunity.name}</h2>
                  <p className="text-xs text-indigo-200">
                    {activeCommunity.category} • {activeCommunity.memberCount} membros
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleMembership}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm ${
                    isMember
                      ? 'bg-white/20 hover:bg-rose-600 hover:text-white text-white'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                  }`}
                >
                  {isMember ? 'Membro (Sair)' : 'Participar'}
                </button>
                <button
                  onClick={() =>
                    openReportModal('community', activeCommunity.id, activeCommunity.creatorId, activeCommunity.name)
                  }
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-500 hover:text-white text-white transition"
                  title="Denunciar comunidade"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description & Rules */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sobre esta comunidade</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeCommunity.description}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-200">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>Regras da Comunidade</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {activeCommunity.rules || 'Respeito, gentileza e diálogo amistoso.'}
                </p>
              </div>
            </div>
          </div>

          {/* Create Post inside Community */}
          {isMember ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <textarea
                rows={2}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder={`Escreva algo para os membros de ${activeCommunity.name}...`}
                maxLength={2000}
                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-transparent focus:border-indigo-500 outline-none text-sm resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handlePostInCommunity}
                  disabled={isPostingInCommunity || !newPostText.trim()}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPostingInCommunity ? 'Publicando...' : 'Publicar na Comunidade'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-800 dark:text-amber-300 text-center">
              Participe desta comunidade para compartilhar publicações e interagir com os membros!
            </div>
          )}

          {/* Community Posts Stream */}
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Publicações na Comunidade ({communityPosts.length})
            </h3>
            {communityPosts.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400 italic">
                  Ainda não há publicações nesta comunidade. Seja o primeiro a postar!
                </p>
              </div>
            ) : (
              communityPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {post.authorName} (@{post.authorUsername})
                    </span>
                    <time>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</time>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Communities Directory */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Comunidades Temáticas</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Participe de grupos de pessoas que compartilham suas maiores paixões e hobbies.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Comunidade</span>
            </button>
          </div>

          {/* Search and Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar comunidades por nome ou tema..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
              {COMMUNITY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Communities Grid */}
          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando comunidades...</div>
          ) : filteredCommunities.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Building2 className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <h3 className="font-bold text-base">Nenhuma comunidade encontrada</h3>
              <p className="text-xs text-slate-500">Crie você mesmo a primeira comunidade sobre este assunto!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCommunities.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onNavigateToCommunity(c.id)}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white font-extrabold text-base flex items-center justify-center flex-shrink-0 shadow-sm">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {c.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                      {c.name}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      <span>{c.memberCount || 1} membros</span>
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      Entrar no espaço →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg">Criar Nova Comunidade</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommunity} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nome da Comunidade *</label>
                <input
                  type="text"
                  required
                  value={commName}
                  onChange={(e) => {
                    setCommName(e.target.value);
                    if (!commSlug) {
                      setCommSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  placeholder="Ex.: Leitores de Ficção Científica"
                  maxLength={80}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Slug na URL *</label>
                <input
                  type="text"
                  required
                  value={commSlug}
                  onChange={(e) => setCommSlug(e.target.value.toLowerCase())}
                  placeholder="leitores-scifi"
                  maxLength={60}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Categoria *</label>
                <select
                  value={commCategory}
                  onChange={(e) => setCommCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                >
                  {COMMUNITY_CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Descrição *</label>
                <textarea
                  required
                  rows={3}
                  value={commDesc}
                  onChange={(e) => setCommDesc(e.target.value)}
                  placeholder="Objetivo da comunidade, assuntos abordados e acolhimento..."
                  maxLength={1000}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Regras de Convivência</label>
                <textarea
                  rows={2}
                  value={commRules}
                  onChange={(e) => setCommRules(e.target.value)}
                  placeholder="Ex.: Respeito mútuo, sem spoilers sem aviso, foco no tema..."
                  maxLength={2000}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition disabled:opacity-50"
                >
                  {isCreating ? 'Criando...' : 'Criar Comunidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
