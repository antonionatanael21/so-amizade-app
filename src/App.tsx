/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider, useUI } from './context/UIContext';
import { testFirestoreConnection } from './services/firebase';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { RightSidebar } from './components/layout/RightSidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { ReportModal } from './components/modals/ReportModal';
import { SupportModal } from './components/modals/SupportModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPages } from './pages/AuthPages';
import { ProfileSetupWizard } from './pages/ProfileSetupWizard';
import { FeedView } from './pages/FeedView';
import { DiscoverView } from './pages/DiscoverView';
import { ProfileView } from './pages/ProfileView';
import { FriendsView } from './pages/FriendsView';
import { MessagesView } from './pages/MessagesView';
import { CommunitiesView } from './pages/CommunitiesView';
import { NotificationsView } from './pages/NotificationsView';
import { SavedPostsView } from './pages/SavedPostsView';
import { SettingsPrivacyView } from './pages/SettingsPrivacyView';
import { PricingPlansView } from './pages/PricingPlansView';
import { TermsOfUse } from './pages/TermsOfUse';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { CommunityGuidelines } from './pages/CommunityGuidelines';
import { HelpCenter } from './pages/HelpCenter';
import { SuspendedAccountPage } from './pages/SuspendedAccountPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { AdminPanelView } from './pages/AdminPanelView';

const MainAppContent: React.FC = () => {
  const { currentUser, profile, isLoading, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isDemoMaintenance, setIsDemoMaintenance] = useState(false);

  // Validate Firestore connectivity on initial load
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Handle URL hash or default routing
  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      if (['login', 'cadastro', 'termos', 'privacidade', 'diretrizes', 'ajuda'].includes(currentRoute)) {
        // preserve public sub-routes
      } else {
        setCurrentRoute('home');
      }
    } else {
      // If user profile is not configured yet (no displayName or bio or is18Plus not checked)
      if (profile && (!profile.is18Plus || !profile.displayName || !profile.username)) {
        setCurrentRoute('setup-profile');
      } else if (currentRoute === 'home' || currentRoute === 'login' || currentRoute === 'cadastro') {
        setCurrentRoute('feed');
      }
    }
  }, [currentUser, profile, isLoading]);

  const navigateTo = (route: string) => {
    // Handle community deep routes
    if (route.startsWith('comunidade_')) {
      const commId = route.replace('comunidade_', '');
      setActiveCommunityId(commId);
      setCurrentRoute('comunidade');
      return;
    }

    // Handle profile deep routes
    if (route.startsWith('perfil_')) {
      const uid = route.replace('perfil_', '');
      setTargetProfileId(uid);
      setCurrentRoute('perfil');
      return;
    }

    if (route === 'perfil') {
      setTargetProfileId(currentUser?.uid || null);
    }

    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartChatWithUser = (userId: string) => {
    setActiveChatUserId(userId);
    setCurrentRoute('mensagens');
  };

  const handleNavigateToUserProfile = (userId: string) => {
    setTargetProfileId(userId);
    setCurrentRoute('perfil');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user account is suspended, render strict suspended account page
  if (currentUser && profile?.isSuspended) {
    return <SuspendedAccountPage />;
  }

  // If maintenance simulation active
  if (isDemoMaintenance) {
    return <MaintenancePage onDismiss={() => setIsDemoMaintenance(false)} />;
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <img src="/logo.svg" alt="SÓ AMIZADE" className="w-full h-full animate-pulse" />
          </div>
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Conectando ao SÓ AMIZADE...
          </p>
        </div>
      </div>
    );
  }

  // Render view router
  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <LandingPage
            onGetStarted={() => setCurrentRoute('cadastro')}
            onLogin={() => setCurrentRoute('login')}
          />
        );

      case 'login':
        return (
          <AuthPages
            initialMode="login"
            onSuccess={() => setCurrentRoute('feed')}
            onNavigateToTerms={() => setCurrentRoute('termos')}
            onNavigateToPrivacy={() => setCurrentRoute('privacidade')}
          />
        );

      case 'cadastro':
        return (
          <AuthPages
            initialMode="register"
            onSuccess={() => setCurrentRoute('setup-profile')}
            onNavigateToTerms={() => setCurrentRoute('termos')}
            onNavigateToPrivacy={() => setCurrentRoute('privacidade')}
          />
        );

      case 'setup-profile':
        return <ProfileSetupWizard onComplete={() => setCurrentRoute('feed')} onNavigateToTerms={() => setCurrentRoute('termos')} onNavigateToPrivacy={() => setCurrentRoute('privacidade')} />;

      case 'feed':
        return (
          <FeedView
            onNavigateToProfile={handleNavigateToUserProfile}
            onNavigateToCommunity={(commId) => {
              setActiveCommunityId(commId);
              setCurrentRoute('comunidade');
            }}
          />
        );

      case 'descobrir':
        return (
          <DiscoverView
            searchQuery={globalSearch}
            setSearchQuery={setGlobalSearch}
            onNavigateToProfile={handleNavigateToUserProfile}
            onStartChat={handleStartChatWithUser}
          />
        );

      case 'perfil':
        return (
          <ProfileView
            userId={targetProfileId || currentUser?.uid}
            onStartChat={handleStartChatWithUser}
            onNavigateToCommunity={(commId) => {
              setActiveCommunityId(commId);
              setCurrentRoute('comunidade');
            }}
          />
        );

      case 'amigos':
        return (
          <FriendsView
            onStartChat={handleStartChatWithUser}
            onNavigateToProfile={handleNavigateToUserProfile}
          />
        );

      case 'mensagens':
        return (
          <MessagesView
            initialChatUserId={activeChatUserId}
            onNavigateToProfile={handleNavigateToUserProfile}
          />
        );

      case 'comunidades':
        return (
          <CommunitiesView
            onNavigateToCommunity={(commId) => {
              setActiveCommunityId(commId);
              setCurrentRoute('comunidade');
            }}
            onBackToList={() => {
              setActiveCommunityId(null);
              setCurrentRoute('comunidades');
            }}
          />
        );

      case 'comunidade':
        return (
          <CommunitiesView
            selectedCommunityId={activeCommunityId}
            onNavigateToCommunity={(commId) => setActiveCommunityId(commId)}
            onBackToList={() => {
              setActiveCommunityId(null);
              setCurrentRoute('comunidades');
            }}
          />
        );

      case 'notificacoes':
        return <NotificationsView onNavigate={navigateTo} />;

      case 'salvos':
        return <SavedPostsView onNavigateToProfile={handleNavigateToUserProfile} />;

      case 'configuracoes':
        return <SettingsPrivacyView onLogout={logout} />;

      case 'planos':
        return <PricingPlansView />;

      case 'admin':
        return <AdminPanelView onNavigateToUser={handleNavigateToUserProfile} />;

      case 'termos':
        return <TermsOfUse onBack={() => navigateTo(currentUser && profile && (!profile.is18Plus || !profile.displayName || !profile.username) ? 'setup-profile' : currentUser ? 'feed' : 'home')} />;

      case 'privacidade':
        return <PrivacyPolicy onBack={() => navigateTo(currentUser && profile && (!profile.is18Plus || !profile.displayName || !profile.username) ? 'setup-profile' : currentUser ? 'feed' : 'home')} />;

      case 'diretrizes':
        return <CommunityGuidelines onBack={() => navigateTo(currentUser ? 'feed' : 'home')} />;

      case 'ajuda':
        return <HelpCenter onBack={() => navigateTo(currentUser ? 'feed' : 'home')} />;

      default:
        return <NotFoundPage onNavigateHome={() => navigateTo(currentUser ? 'feed' : 'home')} />;
    }
  };

  const isPublicStandalone =
    currentRoute === 'home' ||
    currentRoute === 'login' ||
    currentRoute === 'cadastro' ||
    currentRoute === 'setup-profile';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentRoute={currentRoute}
        navigateTo={navigateTo}
        searchQuery={globalSearch}
        setSearchQuery={setGlobalSearch}
      />

      {/* Main App Container */}
      {isPublicStandalone ? (
        <main className="flex-1">{renderCurrentView()}</main>
      ) : (
        <div className="max-w-7xl mx-auto w-full flex-1 flex justify-center px-2 sm:px-4 lg:px-8 py-4 sm:py-6 gap-6">
          {/* Left Navigation Sidebar */}
          <Sidebar currentRoute={currentRoute} navigateTo={navigateTo} />

          {/* Center Main Stage */}
          <main className="flex-1 min-w-0 max-w-3xl w-full">{renderCurrentView()}</main>

          {/* Right Context Sidebar (Feed and Discover) */}
          {(currentRoute === 'feed' || currentRoute === 'descobrir') && (
            <RightSidebar navigateTo={navigateTo} onSelectUser={handleNavigateToUserProfile} />
          )}
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      {!isPublicStandalone && (
        <MobileNav currentRoute={currentRoute} navigateTo={navigateTo} />
      )}

      {/* Global Modals and Toasts */}
      <ReportModal />
      <SupportModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </UIProvider>
  );
}
