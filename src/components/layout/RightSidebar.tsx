import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { Community, UserProfile } from '../../types';
import { Building2, Sparkles, UserPlus, HeartHandshake, ShieldCheck } from 'lucide-react';

interface RightSidebarProps {
  navigateTo: (route: string) => void;
  onSelectUser?: (userId: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ navigateTo, onSelectUser }) => {
  const { profile } = useAuth();
  const [popularCommunities, setPopularCommunities] = useState<Community[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch a few communities
        const comSnap = await getDocs(query(collection(db, 'communities'), limit(4)));
        if (!comSnap.empty) {
          setPopularCommunities(comSnap.docs.map((d) => d.data() as Community));
        }
        // Fetch suggested users
        const userSnap = await getDocs(query(collection(db, 'users'), limit(5)));
        if (!userSnap.empty) {
          const list = userSnap.docs
            .map((d) => d.data() as UserProfile)
            .filter((u) => u.id !== profile?.id);
          setSuggestedUsers(list.slice(0, 3));
        }
      } catch (e) {
        // Safe fallback
      }
    };
    fetchData();
  }, [profile?.id]);

  return (
    <aside className="hidden xl:flex flex-col w-80 flex-shrink-0 p-4 space-y-6">
      {/* Non-intrusive Sponsored Ad (only for Free users per requirement 13) */}
      {profile?.plan !== 'plus' ? (
        <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mb-2">
            <span>Espaço Publicitário</span>
            <button
              onClick={() => navigateTo('planos')}
              className="text-amber-600 dark:text-amber-400 hover:underline capitalize"
            >
              Remover anúncios
            </button>
          </div>
          <div className="rounded-xl overflow-hidden bg-gradient-to-r from-teal-600 to-indigo-700 p-4 text-white">
            <h5 className="font-bold text-sm">Cafés & Livrarias Parceiras</h5>
            <p className="text-xs text-teal-100 mt-1">
              Descontos para encontros amistosos em clubes do livro no Brasil.
            </p>
          </div>
        </div>
      ) : null}

      {/* Suggested Communities */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>Comunidades em Alta</span>
          </h4>
          <button
            onClick={() => navigateTo('comunidades')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Ver todas
          </button>
        </div>

        <div className="space-y-2.5">
          {popularCommunities.length > 0 ? (
            popularCommunities.map((c) => (
              <div
                key={c.id}
                onClick={() => navigateTo(`comunidade_${c.id}`)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {c.category} • {c.memberCount || 1} membros
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic py-2 text-center">
              Explore e participe das primeiras comunidades!
            </div>
          )}
        </div>
      </div>

      {/* Safe Connections Reminder */}
      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
        <div className="flex items-center space-x-2 font-bold text-indigo-700 dark:text-indigo-300">
          <HeartHandshake className="w-4 h-4 text-indigo-600" />
          <span>Pilares da Verdadeira Amizade</span>
        </div>
        <ul className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 space-y-1 list-disc list-inside">
          <li>Respeito mútuo e escuta ativa</li>
          <li>Compartilhamento de afinidades reais</li>
          <li>Zero tolerância para assédio</li>
          <li>Espaço acolhedor e inclusivo</li>
        </ul>
      </div>
    </aside>
  );
};
