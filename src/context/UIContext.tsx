import React, { createContext, useContext, useState, useEffect } from 'react';
import { ReportCategory } from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface ReportModalState {
  isOpen: boolean;
  targetType: 'user' | 'post' | 'comment' | 'message' | 'community';
  targetId: string;
  targetAuthorId?: string;
  targetSnapshot?: string;
}

export interface SupportModalState {
  isOpen: boolean;
  defaultCategory?: string;
  defaultSubject?: string;
}

interface UIContextType {
  isDark: boolean;
  toggleTheme: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  reportModal: ReportModalState;
  openReportModal: (
    targetType: 'user' | 'post' | 'comment' | 'message' | 'community',
    targetId: string,
    targetAuthorId?: string,
    targetSnapshot?: string
  ) => void;
  closeReportModal: () => void;
  supportModal: SupportModalState;
  openSupportModal: (defaultCategory?: string, defaultSubject?: string) => void;
  closeSupportModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('soamizade_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [reportModal, setReportModal] = useState<ReportModalState>({
    isOpen: false,
    targetType: 'user',
    targetId: '',
  });

  const [supportModal, setSupportModal] = useState<SupportModalState>({
    isOpen: false,
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem('soamizade_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem('soamizade_theme', 'light');
      }
    } catch (e) {
      console.error('Erro ao atualizar tema:', e);
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const openSupportModal = (defaultCategory?: string, defaultSubject?: string) => {
    setSupportModal({
      isOpen: true,
      defaultCategory,
      defaultSubject,
    });
  };

  const closeSupportModal = () => {
    setSupportModal((prev) => ({ ...prev, isOpen: false }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openReportModal = (
    targetType: 'user' | 'post' | 'comment' | 'message' | 'community',
    targetId: string,
    targetAuthorId?: string,
    targetSnapshot?: string
  ) => {
    setReportModal({
      isOpen: true,
      targetType,
      targetId,
      targetAuthorId,
      targetSnapshot,
    });
  };

  const closeReportModal = () => {
    setReportModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <UIContext.Provider
      value={{
        isDark,
        toggleTheme,
        toasts,
        showToast,
        removeToast,
        reportModal,
        openReportModal,
        closeReportModal,
        supportModal,
        openSupportModal,
        closeSupportModal,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};
