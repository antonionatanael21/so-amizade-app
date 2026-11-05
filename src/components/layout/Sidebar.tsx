import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import {
  Home,
  Compass,
  Users,
  MessageSquare,
  Sparkles,
  Bookmark,
  Settings,
  HelpCircle,
  ShieldCheck,
  Building2,
  Bell,
  HeartHandshake,
} from 'lucide-react';

interface SidebarProps {
  currentRoute: string;
  navigateTo: (route: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, navigateTo }) => {
  const { currentUser, profile } = useAuth();
  const { openSupportModal } = useUI();

  if (!currentUser) return null;

  const navItems = [
    { id: 'feed', label: 'Feed Social', icon: Home },
    { id: 'descobrir', label: 'Descobrir Pessoas', icon: Compass },
    { id: 'amigos', label: 'Amigos & Pedidos', icon: Users },
    { id: 'comunidades', label: 'Comunidades', icon: Building2 },
    { id: 'mensagens', label: 'Mensagens Diretas', icon: MessageSquare },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'salvos', label: 'Publicações Salvas', icon: Bookmark },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 flex-shrink-0 p-4 space-y-6">
      {/* Mini Profile Card */}
      <div
        onClick={() => navigateTo('perfil')}
        className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer flex items-center space-x-3"
      >
        <img
          src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`}
          alt={profile?.displayName || 'Avatar'}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/30"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {profile?.displayName}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            @{profile?.username}
          </p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Premium Upgrade Promotion */}
      {profile?.plan !== 'plus' && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-teal-900/10 border border-indigo-200 dark:border-indigo-900/50">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase">SÓ AMIZADE+</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
            Destaque no perfil, filtros VIP de amizade e experiência sem anúncios por apenas R$ 9,90/mês.
          </p>
          <button
            onClick={() => navigateTo('planos')}
            className="w-full py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-teal-500 hover:opacity-95 rounded-xl transition shadow-sm"
          >
            Conhecer Benefícios
          </button>
        </div>
      )}

      {/* Community Values & 18+ Safety Badge */}
      <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200/60 dark:border-teal-900/40 text-[11px] text-teal-900 dark:text-teal-200 space-y-1">
        <div className="flex items-center space-x-1.5 font-bold text-teal-700 dark:text-teal-300">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Comunidade Segura 18+</span>
        </div>
        <p className="text-[10px] text-teal-800/80 dark:text-teal-300/80 leading-relaxed">
          Dedicação exclusiva à amizade. Proibido qualquer assédio ou propostas amorosas/sexuais.
        </p>
      </div>

      {/* Footer Info & Legal */}
      <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 space-y-1.5 px-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <button onClick={() => navigateTo('diretrizes')} className="hover:underline">
            Diretrizes
          </button>
          <span>•</span>
          <button onClick={() => navigateTo('termos')} className="hover:underline">
            Termos
          </button>
          <span>•</span>
          <button onClick={() => navigateTo('privacidade')} className="hover:underline">
            Privacidade
          </button>
          <span>•</span>
          <button onClick={() => navigateTo('ajuda')} className="hover:underline">
            Ajuda
          </button>
          <span>•</span>
          <button onClick={() => openSupportModal('Dúvida Geral')} className="text-teal-600 dark:text-teal-400 hover:underline font-semibold">
            Suporte
          </button>
        </div>
        <p>© 2026 SÓ AMIZADE. Suporte: tecnomail09@gmail.com</p>
      </div>
    </aside>
  );
};
