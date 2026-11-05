import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Post } from '../types';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { Bookmark, Trash2, Sparkles, MessageCircle } from 'lucide-react';

export const SavedPostsView: React.FC<{
  onNavigateToProfile: (userId: string) => void;
}> = ({ onNavigateToProfile }) => {
  const { currentUser } = useAuth();
  const { showToast } = useUI();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'savedPosts'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const postIds = snap.docs.map((d) => d.data().postId);

        const list: Post[] = [];
        for (const pId of postIds) {
          const pSnap = await getDoc(doc(db, 'posts', pId));
          if (pSnap.exists()) {
            list.push(pSnap.data() as Post);
          }
        }
        setSavedPosts(list);
      } catch (e) {
        console.warn('Erro ao carregar salvos:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [currentUser]);

  const handleRemoveSaved = async (postId: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'savedPosts', `${currentUser.uid}_${postId}`));
      setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('Item removido dos salvos.');
    } catch (e) {
      showToast('Erro ao remover item.', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-2xl font-extrabold tracking-tight">Publicações Salvas</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Seus itens favoritos e conversas guardadas para reler mais tarde.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Carregando itens salvos...</div>
      ) : savedPosts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-bold text-base">Nenhuma publicação salva ainda</h3>
          <p className="text-xs text-slate-500">
            Clique no botão <strong>Salvar</strong> em qualquer publicação do feed para vê-la aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedPosts.map((post) => (
            <div
              key={post.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div
                  onClick={() => onNavigateToProfile(post.authorId)}
                  className="flex items-center space-x-2.5 cursor-pointer"
                >
                  <img
                    src={
                      post.authorPhotoURL ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`
                    }
                    alt={post.authorName}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {post.authorName}
                    </h4>
                    <span className="text-[11px] text-slate-400">@{post.authorUsername}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveSaved(post.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Remover dos salvos"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {post.content}
              </p>

              {post.mediaUrl && (
                <img
                  src={post.mediaUrl}
                  alt="Mídia"
                  className="rounded-2xl max-h-60 w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
