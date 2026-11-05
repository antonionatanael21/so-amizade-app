import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Sparkles, Check, ArrowRight, MapPin, ShieldCheck, Calendar } from 'lucide-react';
import { calculateAge } from '../utils/age';

const SUGGESTED_INTERESTS = [
  'Cinema & Séries',
  'Leitura & Livros',
  'Tecnologia',
  'Games & E-sports',
  'Música & Shows',
  'Fotografia',
  'Culinária & Café',
  'Viagens & Trilhas',
  'Artes Visuais',
  'Esportes & Fitness',
  'Filosofia & Debates',
  'Animais & Pets',
  'Idiomas & Culturas',
  'Ciência & Astronomia',
  'Jardinagem & Plantas',
  'Empreendedorismo',
];

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
];

export const ProfileSetupWizard: React.FC<{ onComplete: () => void; onNavigateToTerms: () => void; onNavigateToPrivacy: () => void }> = ({ onComplete, onNavigateToTerms, onNavigateToPrivacy }) => {
  const { profile, updateProfileData, verifyAge } = useAuth();
  const { showToast } = useUI();

  const [step, setStep] = useState(1);
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || PRESET_AVATARS[0]);
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || 'PE');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests || []);
  const [favoriteMusic, setFavoriteMusic] = useState(profile?.favoriteMusic || '');
  const [favoriteMovies, setFavoriteMovies] = useState(profile?.favoriteMovies || '');
  const [isSaving, setIsSaving] = useState(false);
  const [ageBirthDate, setAgeBirthDate] = useState('');
  const [confirmAdult, setConfirmAdult] = useState(false);
  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const [isVerifyingAge, setIsVerifyingAge] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  const agePreview = ageBirthDate ? calculateAge(ageBirthDate) : null;

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAgeVerification = async () => {
    setAgeError(null);
    if (!ageBirthDate) {
      setAgeError('Informe sua data de nascimento.');
      return;
    }
    if (!agePreview?.isValid) {
      setAgeError(agePreview?.error || 'O SÓ AMIZADE é exclusivo para maiores de 18 anos.');
      return;
    }
    if (!confirmAdult) {
      setAgeError('Confirme que você tem 18 anos ou mais para continuar.');
      return;
    }
    if (!acceptPolicies) {
      setAgeError('Leia e aceite os Termos de Uso e a Política de Privacidade para continuar.');
      return;
    }

    setIsVerifyingAge(true);
    try {
      await verifyAge(ageBirthDate);
      showToast('Maioridade validada. Agora vamos configurar seu perfil!', 'success');
    } catch (error: any) {
      setAgeError(error?.message || 'Não foi possível concluir a verificação.');
    } finally {
      setIsVerifyingAge(false);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await updateProfileData({
        photoURL,
        bio: bio.trim() || 'Pronto(a) para fazer amizades saudáveis e conversar!',
        city: city.trim(),
        state: state.trim(),
        interests: selectedInterests,
        favoriteMusic: favoriteMusic.trim(),
        favoriteMovies: favoriteMovies.trim(),
      });
      showToast('Perfil configurado com sucesso!', 'success');
      onComplete();
    } catch (e) {
      showToast('Erro ao salvar informações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile?.is18Plus) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-9 space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold">Confirme sua maioridade</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              O SÓ AMIZADE é uma rede social exclusiva para adultos. Sua data de nascimento ficará privada e não aparecerá no seu perfil público.
            </p>
          </div>

          {ageError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-sm text-rose-700 dark:text-rose-300">
              {ageError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Data de nascimento
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                value={ageBirthDate}
                onChange={(event) => { setAgeBirthDate(event.target.value); setAgeError(null); }}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {ageBirthDate && (
              <p className={`text-xs mt-2 font-semibold ${agePreview?.isValid ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {agePreview?.isValid ? `Idade informada: ${agePreview.age} anos` : agePreview?.error || 'Data inválida'}
              </p>
            )}
          </div>

          <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <input
              type="checkbox"
              checked={confirmAdult}
              onChange={(event) => setConfirmAdult(event.target.checked)}
              className="mt-0.5 accent-indigo-600"
            />
            <span>Declaro que tenho 18 anos ou mais e que as informações fornecidas são verdadeiras.</span>
          </label>

          <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <input
              type="checkbox"
              checked={acceptPolicies}
              onChange={(event) => setAcceptPolicies(event.target.checked)}
              className="mt-0.5 accent-indigo-600"
            />
            <span>
              Li e concordo com os{' '}
              <button type="button" onClick={onNavigateToTerms} className="text-indigo-600 dark:text-indigo-400 underline">Termos de Uso</button>{' '}
              e a{' '}
              <button type="button" onClick={onNavigateToPrivacy} className="text-indigo-600 dark:text-indigo-400 underline">Política de Privacidade</button>.
            </span>
          </label>

          <button
            type="button"
            onClick={handleAgeVerification}
            disabled={isVerifyingAge || !agePreview?.isValid || !confirmAdult || !acceptPolicies}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold shadow-md transition disabled:opacity-50"
          >
            {isVerifyingAge ? 'Verificando...' : 'Confirmar e continuar'}
          </button>
          <p className="text-[11px] text-center text-slate-400">
            Menores de 18 anos não podem utilizar a plataforma.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-8">
        {/* Progress indicator */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            <span>Passo {step} de 3</span>
            <span>Configuração do Perfil</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Avatar & Location */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold">Escolha como você quer ser visto</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Selecione um avatar amigável ou insira uma foto de perfil.
              </p>
            </div>

            {/* Current avatar preview */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <img
                src={photoURL}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/30 bg-slate-100 dark:bg-slate-800 shadow-md"
              />
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {PRESET_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoURL(av)}
                    className={`w-11 h-11 rounded-full p-0.5 border-2 transition ${
                      photoURL === av
                        ? 'border-indigo-600 scale-105 ring-2 ring-indigo-500/20'
                        : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={av} alt="Avatar option" className="w-full h-full rounded-full" />
                  </button>
                ))}
              </div>
            </div>

            {/* City & State (No exact address per requirements) */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Sua Cidade (opcional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex.: Recife"
                    maxLength={60}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="PE"
                  maxLength={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 uppercase text-center"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition"
              >
                <span>Avançar para Interesses</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Interests Picker */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold">O que você gosta de fazer e conversar?</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Selecione seus interesses para ajudarmos você a descobrir pessoas com gostos parecidos.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto p-1">
              {SUGGESTED_INTERESTS.map((item) => {
                const isSelected = selectedInterests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{item}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition"
              >
                <span>Avançar para Biografia</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Bio and Media Favorites */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold">Conte um pouco sobre você</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Uma breve biografia amigável para quebrar o gelo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Sua Biografia
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ex.: Adoro trocar ideias sobre livros, filmes de suspense e passear aos finais de semana. Aqui para fazer boas amizades!"
                maxLength={500}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
              <span className="text-[11px] text-slate-400">{bio.length}/500</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Músicas ou artistas favoritos
                </label>
                <input
                  type="text"
                  value={favoriteMusic}
                  onChange={(e) => setFavoriteMusic(e.target.value)}
                  placeholder="Ex.: MPB, Rock, Jazz..."
                  maxLength={100}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Filmes ou séries favoritas
                </label>
                <input
                  type="text"
                  value={favoriteMovies}
                  onChange={(e) => setFavoriteMovies(e.target.value)}
                  placeholder="Ex.: Interestelar, Breaking Bad..."
                  maxLength={100}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinish}
                className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                <span>{isSaving ? 'Salvando Perfil...' : 'Entrar no SÓ AMIZADE'}</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
