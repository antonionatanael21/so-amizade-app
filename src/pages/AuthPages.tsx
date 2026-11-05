import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { calculateAge } from '../utils/age';
import { validateUsername } from '../utils/validation';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  AtSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';

interface AuthPagesProps {
  initialMode?: 'login' | 'register' | 'forgot';
  onSuccess: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode = 'login',
  onSuccess,
  onNavigateToTerms,
  onNavigateToPrivacy,
}) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const { showToast, isDark, toggleTheme } = useUI();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Forgot password states
  const [resetStep, setResetStep] = useState<'request' | 'link_sent'>('request');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [confirm18, setConfirm18] = useState(false);

  // Live age calculation
  const ageValidation = birthDate ? calculateAge(birthDate) : null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
      showToast('Bem-vindo(a) de volta ao SÓ AMIZADE!', 'success');
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate age
    if (!birthDate) {
      setFormError('Informe sua data de nascimento.');
      return;
    }
    const ageResult = calculateAge(birthDate);
    if (!ageResult.isValid) {
      setFormError(ageResult.error || 'Idade mínima não atingida.');
      return;
    }

    // Validate username
    const userResult = validateUsername(username);
    if (!userResult.isValid) {
      setFormError(userResult.error || 'Nome de usuário inválido.');
      return;
    }

    // Check passwords
    if (password.length < 6) {
      setFormError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('As senhas digitadas não coincidem.');
      return;
    }

    // Check agreements
    if (!agreeTerms) {
      setFormError('Você deve concordar com os Termos de Uso e Política de Privacidade.');
      return;
    }
    if (!confirm18) {
      setFormError('Você deve confirmar sob as penas da lei que possui 18 anos ou mais.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerWithEmail({
        email: email.trim(),
        pass: password,
        displayName: displayName.trim(),
        username: username.toLowerCase().trim(),
        birthDate,
        is18Plus: true,
      });
      showToast('Conta criada com sucesso! Seja bem-vindo(a).', 'success');
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Falha no cadastro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);

    if (mode === 'register') {
      if (!birthDate) {
        setFormError('Informe sua data de nascimento antes de continuar com o Google.');
        return;
      }
      const ageResult = calculateAge(birthDate);
      if (!ageResult.isValid) {
        setFormError(ageResult.error || 'A plataforma é exclusiva para maiores de 18 anos.');
        return;
      }
      if (!agreeTerms || !confirm18) {
        setFormError('Confirme sua maioridade e aceite os Termos de Uso e a Política de Privacidade.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await loginWithGoogle(mode === 'register' ? birthDate : undefined);
      showToast('Conectado com sucesso via Google!', 'success');
      onSuccess();
    } catch (err: any) {
      setFormError(err?.message || 'Falha no login com Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use Firebase Authentication's native password-reset flow.
  const handleSendResetLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    if (!email.trim() || !email.includes('@')) {
      setFormError('Informe um endereço de e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email.trim());
      setResetStep('link_sent');
      showToast('Solicitação de recuperação enviada pelo Firebase!', 'success');
    } catch (err: any) {
      setFormError(err.message || 'Não foi possível solicitar a redefinição.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-6">
        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          aria-label="Alternar tema"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
        </button>

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 shadow-md mb-2">
            <img src="/logo.svg" alt="SÓ AMIZADE Logo" className="w-10 h-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {mode === 'login' && 'Entrar no SÓ AMIZADE'}
            {mode === 'register' && 'Crie sua conta'}
            {mode === 'forgot' && 'Recuperar Senha'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' && 'Amizades verdadeiras começam aqui.'}
            {mode === 'register' && 'Exclusivo para maiores de 18 anos. Construa conexões reais.'}
            {mode === 'forgot' && 'Digite seu e-mail para receber as instruções.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        {mode !== 'forgot' && (
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => {
                setMode('login');
                setFormError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Fazer Login
            </button>
            <button
              onClick={() => {
                setMode('register');
                setFormError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Criar Conta Nova
            </button>
          </div>
        )}

        {/* Error Feedback */}
        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-start space-x-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Google Quick Sign-In */}
        {mode !== 'forgot' && (
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              type="button"
              className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              <span className="absolute bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 uppercase tracking-wider">
                ou com e-mail
              </span>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setFormError(null);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar na Conta'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Nome de exibição *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ex.: Mariana Silva"
                    maxLength={70}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  @Usuário único *
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="mariana_silva"
                    maxLength={30}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Birthdate & 18+ verification */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>Data de Nascimento * (Exclusivo 18+)</span>
                </label>
                <span className="text-[10px] text-slate-400 italic">Nunca exibida publicamente</span>
              </div>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {birthDate && (
                <div className="text-xs flex items-center space-x-1.5 pt-1">
                  {ageValidation?.isValid ? (
                    <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Idade válida: {ageValidation.age} anos (Requisito 18+ atendido)</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{ageValidation?.error || 'Menor de 18 anos não permitido'}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                E-mail *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Senha * (mínimo 6)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Legal agreements */}
            <div className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={confirm18}
                  onChange={(e) => setConfirm18(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  Declaro sob as penas da lei que <strong>tenho 18 anos ou mais</strong> e compreendo que esta rede é exclusivamente voltada à amizade, sem conotação sexual ou de relacionamentos amorosos.
                </span>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  Li e concordo com os{' '}
                  <button
                    type="button"
                    onClick={onNavigateToTerms}
                    className="text-indigo-600 dark:text-indigo-400 underline"
                  >
                    Termos de Uso
                  </button>{' '}
                  e a{' '}
                  <button
                    type="button"
                    onClick={onNavigateToPrivacy}
                    className="text-indigo-600 dark:text-indigo-400 underline"
                  >
                    Política de Privacidade (LGPD)
                  </button>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !ageValidation?.isValid || !confirm18 || !agreeTerms}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Criando Conta...' : 'Concluir Cadastro'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            {resetStep === 'request' && (
              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    E-mail cadastrado na sua conta
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    O Firebase enviará um link seguro para redefinir sua senha. O site nunca solicita sua senha atual por e-mail.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enviando solicitação...' : 'Enviar link de redefinição'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setFormError(null); }}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  >
                    Lembrei minha senha • Voltar ao login
                  </button>
                </div>
              </form>
            )}

            {resetStep === 'link_sent' && (
              <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center space-y-3 text-indigo-900 dark:text-indigo-200 animate-scale-in">
                <CheckCircle2 className="w-9 h-9 text-indigo-600 mx-auto" />
                <p className="font-bold text-sm">Solicitação processada</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Caso exista uma conta vinculada a <strong>{email}</strong>, o Firebase enviará um link de redefinição. Verifique também a pasta de spam.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep('request')}
                    className="flex-1 py-2 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 rounded-xl"
                  >
                    Tentar outro e-mail
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setResetStep('request'); }}
                    className="flex-1 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                  >
                    Voltar ao Login
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
