import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import {
  Search,
  Bell,
  MessageSquare,
  Shield,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Bookmark,
  Users,
  Compass,
  Home,
  Check,
  LifeBuoy,
} from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface NavbarProps {
  currentRoute: string;
  navigateTo: (route: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  navigateTo,
  searchQuery,
  setSearchQuery,
}) => {
  const { currentUser, profile, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme, openSupportModal } = useUI();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Listen to unread notifications count
  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid),
        where('read', '==', false)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setUnreadNotifications(snapshot.size);
      }, (err) => {
        console.warn('Erro ao escutar notificações:', err.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Erro ao configurar listener de notificações:', e);
    }
  }, [currentUser]);

  // Listen to friend requests count
  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('receiverId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        // Can add to badge count
      }, () => {});
      return () => unsub();
    } catch (e) {}
  }, [currentUser]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Slogan */}
          <div
            onClick={() => navigateTo(currentUser ? 'feed' : 'home')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="relative w-10 h-10 flex-shrink-0">
              <img
                src="/logo.svg"
                alt="SÓ AMIZADE Logo"
                className="w-full h-full transform group-hover:scale-105 transition duration-200"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-teal-600 text-[9px] font-extrabold text-white rounded-full uppercase tracking-widest shadow-sm">
                18+
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 bg-clip-text text-transparent">
                  SÓ AMIZADE
                </span>
                {profile?.plan === 'plus' && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-700">
                    PLUS
                  </span>
                )}
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                Amizades verdadeiras começam aqui
              </p>
            </div>
          </div>

          {/* Global Search Bar (when logged in or on discover) */}
          {currentUser && (
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (currentRoute !== 'descobrir') {
                      navigateTo('descobrir');
                    }
                  }}
                  placeholder="Buscar amigos por nome, @usuário, interesses ou cidade..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Action Icons & User Dropdown */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Alternar tema"
              title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {currentUser ? (
              <>
                {/* Só Amizade+ Plan Shortcut */}
                <button
                  onClick={() => navigateTo('planos')}
                  className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-teal-500/10 border border-amber-300 dark:border-amber-600/40 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:opacity-90 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>SÓ AMIZADE+</span>
                </button>

                {/* Messages icon */}
                <button
                  onClick={() => navigateTo('mensagens')}
                  className={`relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    currentRoute === 'mensagens' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                  aria-label="Mensagens privadas"
                  title="Mensagens"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  )}
                </button>

                {/* Notifications icon */}
                <button
                  onClick={() => navigateTo('notificacoes')}
                  className={`relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    currentRoute === 'notificacoes' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                  aria-label="Notificações"
                  title="Notificações"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 min-w-[18px] text-[10px] font-bold text-white bg-rose-500 rounded-full flex items-center justify-center shadow-sm">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Admin badge link */}
                {isAdmin && (
                  <button
                    onClick={() => navigateTo('admin')}
                    className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                    title="Painel Administrativo"
                    aria-label="Painel Administrativo"
                  >
                    <Shield className="w-5 h-5" />
                  </button>
                )}

                {/* User Avatar & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-indigo-500/30 transition outline-none"
                    aria-label="Menu do usuário"
                  >
                    <img
                      src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`}
                      alt={profile?.displayName || 'Avatar'}
                      className="w-8 h-8 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-scale-in"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {profile?.displayName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          @{profile?.username}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {profile?.plan === 'plus' ? 'Assinante SÓ AMIZADE+' : 'Plano Gratuito'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          navigateTo('perfil');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Meu Perfil</span>
                      </button>

                      <button
                        onClick={() => {
                          navigateTo('salvos');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                      >
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        <span>Publicações Salvas</span>
                      </button>

                      <button
                        onClick={() => {
                          navigateTo('configuracoes');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Configurações & Privacidade</span>
                      </button>

                      <button
                        onClick={() => {
                          toggleTheme();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                      >
                        <div className="flex items-center space-x-2.5">
                          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
                          <span>{isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {isDark ? '🌙 Escuro' : '☀️ Claro'}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          navigateTo('planos');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition font-medium"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Plano SÓ AMIZADE+</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            navigateTo('admin');
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition font-medium"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Painel Administrativo</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          navigateTo('ajuda');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                        <span>Central de Ajuda</span>
                      </button>

                      <button
                        onClick={() => {
                          openSupportModal();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition font-medium"
                      >
                        <LifeBuoy className="w-4 h-4 text-teal-500" />
                        <span>Falar com o Suporte</span>
                      </button>

                      <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sair da Conta</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateTo('login')}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition"
                >
                  Entrar
                </button>
                <button
                  onClick={() => navigateTo('cadastro')}
                  className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 rounded-full shadow-sm shadow-indigo-500/20 transition"
                >
                  Criar Conta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
