import React from 'react';
import { Home, Compass, Users, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentRoute: string;
  navigateTo: (route: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentRoute, navigateTo }) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const tabs = [
    { id: 'feed', label: 'Início', icon: Home },
    { id: 'descobrir', label: 'Descobrir', icon: Compass },
    { id: 'amigos', label: 'Amigos', icon: Users },
    { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
    { id: 'perfil', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRoute === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigateTo(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              </div>
              <span className="text-[11px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
