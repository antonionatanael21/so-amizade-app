import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import {
  Post,
  Comment,
  ReactionType,
  REACTION_TYPES,
  Community,
} from '../types';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  increment,
  where,
} from 'firebase/firestore';
import {
  Send,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Flag,
  Trash2,
  Edit2,
  Building2,
  Smile,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface FeedViewProps {
  onNavigateToProfile: (userId: string) => void;
  onNavigateToCommunity: (communityId: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  onNavigateToProfile,
  onNavigateToCommunity,
}) => {
  const { currentUser, profile, isAdmin } = useAuth();
  const { showToast, openReportModal } = useUI();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // New post states
  const [postContent, setPostContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);

  // Active reactions picker & comments expanded map
  const [activeReactionPostId, setActiveReactionPostId] = useState<string | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Saved posts set
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());

  // Edit post states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch user's communities for the community selector
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'communities'), limit(15)));
        setUserCommunities(snap.docs.map((d) => d.data() as Community));
      } catch (e) {}
    };
    fetchCommunities();
  }, []);

  // Fetch user saved posts
  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'savedPosts'), where('userId', '==', currentUser.uid));
      const unsub = onSnapshot(q, (snap) => {
        const ids = new Set<string>();
        snap.forEach((d) => ids.add(d.data().postId));
        setSavedPostIds(ids);
      }, () => {});
      return () => unsub();
    } catch (e) {}
  }, [currentUser]);

  // Listen to feed posts
  useEffect(() => {
    setLoading(true);
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: Post[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Post);
          });
          setPosts(list);
          setLoading(false);
        },
        (error) => {
          console.warn('Erro ao carregar publicações:', error.message);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      setLoading(false);
    }
  }, []);

  // Create new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;
    if (!postContent.trim() && !mediaUrl.trim()) {
      showToast('Escreva algo ou adicione uma imagem para publicar.', 'error');
      return;
    }

    setIsPosting(true);
    try {
      const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const selectedComm = userCommunities.find((c) => c.id === selectedCommunityId);

      const newPost: Post = {
        id: postId,
        authorId: currentUser.uid,
        authorName: profile.displayName,
        authorUsername: profile.username,
        authorPhotoURL: profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
        content: postContent.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
        communityId: selectedComm?.id || undefined,
        communityName: selectedComm?.name || undefined,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isEdited: false,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'posts', postId), newPost);

      // Increment community postCount if applicable
      if (selectedComm) {
        try {
          await updateDoc(doc(db, 'communities', selectedComm.id), {
            postCount: increment(1),
          });
        } catch (e) {}
      }

      setPostContent('');
      setMediaUrl('');
      setShowImageInput(false);
      setSelectedCommunityId('');
      showToast('Publicação compartilhada com seus amigos!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'posts');
      showToast('Erro ao publicar. Verifique sua conexão.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  // Add / Toggle reaction
  const handleReaction = async (post: Post, type: ReactionType) => {
    if (!currentUser) return;
    const likeRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
    const postRef = doc(db, 'posts', post.id);

    try {
      const likeSnap = await getDoc(likeRef);
      if (likeSnap.exists()) {
        const existingData = likeSnap.data();
        if (existingData.type === type) {
          // Remove reaction
          await deleteDoc(likeRef);
          await updateDoc(postRef, { likesCount: increment(-1) });
        } else {
          // Change reaction type
          await updateDoc(likeRef, { type });
        }
      } else {
        // New reaction
        await setDoc(likeRef, {
          id: currentUser.uid,
          postId: post.id,
          userId: currentUser.uid,
          type,
          createdAt: new Date().toISOString(),
        });
        await updateDoc(postRef, { likesCount: increment(1) });
      }
      setActiveReactionPostId(null);
    } catch (e) {
      console.warn('Erro ao reagir:', e);
    }
  };

  // Toggle comments expand and listen to comments for this post
  const toggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }
    setActiveCommentsPostId(postId);

    try {
      const q = query(
        collection(db, 'posts', postId, 'comments'),
        orderBy('createdAt', 'asc'),
        limit(50)
      );
      onSnapshot(q, (snap) => {
        const list: Comment[] = [];
        snap.forEach((d) => list.push(d.data() as Comment));
        setPostComments((prev) => ({ ...prev, [postId]: list }));
      });
    } catch (e) {}
  };

  // Submit comment
  const handleAddComment = async (postId: string) => {
    const text = newCommentText[postId]?.trim();
    if (!currentUser || !profile || !text) return;

    setIsSubmittingComment(true);
    try {
      const commentId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const commentData: Comment = {
        id: commentId,
        postId,
        authorId: currentUser.uid,
        authorName: profile.displayName,
        authorUsername: profile.username,
        authorPhotoURL: profile.photoURL,
        content: text,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'posts', postId, 'comments', commentId), commentData);
      await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });

      setNewCommentText((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `posts/${postId}/comments`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Toggle Save Post
  const handleToggleSave = async (postId: string) => {
    if (!currentUser) return;
    const saveId = `${currentUser.uid}_${postId}`;
    const saveRef = doc(db, 'savedPosts', saveId);

    try {
      if (savedPostIds.has(postId)) {
        await deleteDoc(saveRef);
        showToast('Publicação removida dos seus itens salvos.');
      } else {
        await setDoc(saveRef, {
          id: saveId,
          userId: currentUser.uid,
          postId,
          createdAt: new Date().toISOString(),
        });
        showToast('Publicação salva com sucesso!', 'success');
      }
    } catch (e) {
      showToast('Falha ao atualizar itens salvos.', 'error');
    }
  };

  // Delete own post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir esta publicação?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      showToast('Publicação excluída com sucesso.');
    } catch (e) {
      showToast('Erro ao excluir publicação.', 'error');
    }
  };

  // Save edited post
  const handleSaveEdit = async (postId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateDoc(doc(db, 'posts', postId), {
        content: editContent.trim(),
        isEdited: true,
        updatedAt: new Date().toISOString(),
      });
      setEditingPostId(null);
      showToast('Publicação atualizada!', 'success');
    } catch (e) {
      showToast('Erro ao salvar edição.', 'error');
    }
  };

  // Share post within platform
  const handleSharePost = async (post: Post) => {
    if (!currentUser || !profile) return;
    try {
      const sharePostId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newPost: Post = {
        id: sharePostId,
        authorId: currentUser.uid,
        authorName: profile.displayName,
        authorUsername: profile.username,
        authorPhotoURL: profile.photoURL,
        content: `Compartilhado de @${post.authorUsername}: "${post.content.slice(0, 200)}..."`,
        mediaUrl: post.mediaUrl,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'posts', sharePostId), newPost);
      await updateDoc(doc(db, 'posts', post.id), { sharesCount: increment(1) });
      showToast('Compartilhado no seu feed com sucesso!', 'success');
    } catch (e) {
      showToast('Não foi possível compartilhar a publicação.', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Create Post Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-start space-x-3">
          <img
            src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`}
            alt="Seu Avatar"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
          />
          <div className="flex-1">
            <textarea
              rows={3}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="O que você está pensando ou vivenciando hoje? Compartilhe com seus amigos..."
              maxLength={2000}
              className="w-full bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm outline-none resize-none transition"
            />

            {/* Optional Media URL input */}
            {showImageInput && (
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Cole o link direto da imagem (URL https://...)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl('');
                    setShowImageInput(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Media preview */}
            {mediaUrl && (
              <div className="relative mt-2 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-60">
                <img src={mediaUrl} alt="Pré-visualização" className="w-full h-auto object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Action bar for post creation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ImageIcon className="w-4 h-4 text-teal-500" />
              <span>Foto</span>
            </button>

            {/* Community selector */}
            {userCommunities.length > 0 && (
              <select
                value={selectedCommunityId}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none max-w-[150px] truncate"
              >
                <option value="">Geral (Feed Principal)</option>
                {userCommunities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={handleCreatePost}
            disabled={isPosting || (!postContent.trim() && !mediaUrl.trim())}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isPosting ? 'Publicando...' : 'Publicar'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feed list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-20 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="w-full h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 mx-auto flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">O feed ainda está tranquilo por aqui!</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Seja a primeira pessoa a compartilhar uma boa mensagem ou explore a aba <strong>Descobrir</strong> para adicionar novos amigos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isAuthor = currentUser?.uid === post.authorId;
            const isSaved = savedPostIds.has(post.id);
            const isEditing = editingPostId === post.id;
            const comments = postComments[post.id] || [];

            return (
              <article
                key={post.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Post Header */}
                <div className="p-5 pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.authorPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
                      alt={post.authorName}
                      onClick={() => onNavigateToProfile(post.authorId)}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer ring-1 ring-slate-200 dark:ring-slate-700 hover:opacity-90"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span
                          onClick={() => onNavigateToProfile(post.authorId)}
                          className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline cursor-pointer"
                        >
                          {post.authorName}
                        </span>
                        <span className="text-xs text-slate-400">@{post.authorUsername}</span>
                        {post.communityName && (
                          <span
                            onClick={() => post.communityId && onNavigateToCommunity(post.communityId)}
                            className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 cursor-pointer"
                          >
                            <Building2 className="w-3 h-3" />
                            <span>{post.communityName}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        <time dateTime={post.createdAt}>
                          {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                        {post.isEdited && <span>• editado</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Menu */}
                  <div className="flex items-center space-x-1">
                    {isAuthor && (
                      <button
                        onClick={() => {
                          setEditingPostId(post.id);
                          setEditContent(post.content);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Editar publicação"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {isAuthor && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                        title="Excluir publicação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        openReportModal('post', post.id, post.authorId, post.content)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Denunciar conteúdo inadequado"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-5 py-2">
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 rounded-xl border border-indigo-400 bg-slate-50 dark:bg-slate-800 text-sm outline-none resize-none"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingPostId(null)}
                          className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(post.id)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {post.content}
                    </p>
                  )}
                </div>

                {/* Post Attached Media */}
                {post.mediaUrl && (
                  <div className="mt-3 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={post.mediaUrl}
                      alt="Mídia da publicação"
                      className="w-full max-h-96 object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Counters summary */}
                <div className="px-5 pt-3 pb-1 flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-1.5">
                    {post.likesCount > 0 && (
                      <span className="flex items-center space-x-1 text-rose-500 font-semibold">
                        <span>❤️</span>
                        <span>{post.likesCount} reações</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {post.commentsCount > 0 && (
                      <button onClick={() => toggleComments(post.id)} className="hover:underline">
                        {post.commentsCount} comentários
                      </button>
                    )}
                    {post.sharesCount > 0 && <span>{post.sharesCount} compartilhamentos</span>}
                  </div>
                </div>

                {/* Bottom interaction buttons */}
                <div className="relative px-3 py-1.5 flex items-center justify-between">
                  {/* Reaction Button with Popover */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveReactionPostId(
                          activeReactionPostId === post.id ? null : post.id
                        )
                      }
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>Reagir</span>
                    </button>

                    {/* 5 Friendship Reactions Popover */}
                    {activeReactionPostId === post.id && (
                      <div className="absolute bottom-full left-0 mb-2 flex items-center space-x-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 z-30 animate-scale-in">
                        {(Object.keys(REACTION_TYPES) as ReactionType[]).map((type) => {
                          const r = REACTION_TYPES[type];
                          return (
                            <button
                              key={type}
                              onClick={() => handleReaction(post, type)}
                              className="p-1.5 hover:scale-125 transition-transform flex flex-col items-center group"
                              title={r.label}
                            >
                              <span className="text-xl leading-none">{r.emoji}</span>
                              <span className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition mt-0.5">
                                {r.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Comment trigger */}
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <MessageCircle className="w-4 h-4 text-teal-500" />
                    <span>Comentar</span>
                  </button>

                  {/* Share trigger */}
                  <button
                    onClick={() => handleSharePost(post)}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Share2 className="w-4 h-4 text-indigo-500" />
                    <span className="hidden sm:inline">Compartilhar</span>
                  </button>

                  {/* Save trigger */}
                  <button
                    onClick={() => handleToggleSave(post.id)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                      isSaved
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{isSaved ? 'Salvo' : 'Salvar'}</span>
                  </button>
                </div>

                {/* Expanded Comments Section */}
                {activeCommentsPostId === post.id && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {/* Comments list */}
                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {comments.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-2">
                          Seja o primeiro a deixar um comentário amigo!
                        </p>
                      ) : (
                        comments.map((comm) => (
                          <div key={comm.id} className="flex items-start space-x-2.5 text-xs">
                            <img
                              src={comm.authorPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comm.authorId}`}
                              alt={comm.authorName}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {comm.authorName}
                                </span>
                                <time className="text-[10px] text-slate-400">
                                  {new Date(comm.createdAt).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </time>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 mt-1">
                                {comm.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* New comment input */}
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="text"
                        value={newCommentText[post.id] || ''}
                        onChange={(e) =>
                          setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                        placeholder="Escreva um comentário amigável e respeitoso..."
                        maxLength={1000}
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={isSubmittingComment || !newCommentText[post.id]?.trim()}
                        className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
