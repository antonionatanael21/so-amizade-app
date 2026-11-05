import {
  HeartHandshake,
  ShieldCheck,
  Users,
  Sparkles,
  MessageCircle,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle,
  LifeBuoy,
} from 'lucide-react';
import { useUI } from '../context/UIContext';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onLearnMore?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
}) => {
  const { openSupportModal } = useUI();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-teal-500/10 blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* 18+ and Friendship Notice Pill */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs sm:text-sm font-semibold shadow-sm animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            <span>Exclusivo para 18+ • Dedicado 100% à Amizade Verdadeira</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Amizades verdadeiras{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 bg-clip-text text-transparent">
              começam aqui.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Uma rede social acolhedora e segura, livre de joguinhos e propostas amorosas. Conecte-se com pessoas reais que compartilham seus interesses, hobbies e valores.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5 transition duration-200 flex items-center justify-center space-x-2"
            >
              <span>Criar Conta Gratuita</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-base shadow-sm transition duration-200"
            >
              Já sou membro • Entrar
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs sm:text-sm">Ambiente Seguro</p>
                <p className="text-[11px] text-slate-500">Zero tolerância para assédio</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start space-x-3">
              <Lock className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs sm:text-sm">Não é Dating</p>
                <p className="text-[11px] text-slate-500">Apenas conversas amistosas</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start space-x-3">
              <Users className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs sm:text-sm">Afinidades Reais</p>
                <p className="text-[11px] text-slate-500">Livros, filmes, jogos e arte</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs sm:text-sm">Comunidades</p>
                <p className="text-[11px] text-slate-500">Espaços temáticos vivos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Difference Section: Por que o SÓ AMIZADE é diferente? */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-teal-600 dark:text-teal-400 mb-2">
              Nossa Missão
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Uma rede social feita para quem busca boas conversas e pessoas de verdade.
            </h3>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              A solidão na era digital cresceu porque a maioria dos aplicativos foca em paquera rápida, números vazios ou métricas de vaidade. O SÓ AMIZADE resgata a essência das conexões sinceras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold">1. Foco Estrito em Amizade</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Aqui você não encontrará arrastar para o lado nem abordagens românticas indesejadas. Todas as regras e mecanismos foram criados para promover o respeito e a camaradagem.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold">2. Descoberta por Afinidades</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Encontre pessoas que amam os mesmos livros, games, viagens, receitas e estilos musicais. Nosso algoritmo prioriza compatibilidade de assuntos, não aparências.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold">3. Moderação Humana Rigorosa</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Regras claras contra perseguição, desrespeito e perfis falsos. Canal rápido de denúncia e penalidades progressivas para garantir que o ambiente continue amigável.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Institucional: AMIZADE COMEÇA POR INTERESSES EM COMUM */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Propósito & Comunidade</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            AMIZADE COMEÇA POR INTERESSES EM COMUM
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Um espaço para conhecer pessoas, compartilhar interesses e construir amizades verdadeiras, sem pressão e sem julgamentos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* CARD 1 — CONEXÕES VERDADEIRAS */}
          <div className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-400/80 dark:hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Card 1
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  CONEXÕES VERDADEIRAS
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Conheça pessoas com interesses semelhantes aos seus e descubra novas possibilidades de amizade.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Afinidades reais e espontâneas</span>
            </div>
          </div>

          {/* CARD 2 — COMUNIDADES */}
          <div className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-violet-400/80 dark:hover:border-violet-500/50 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Card 2
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  COMUNIDADES
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Encontre espaços para compartilhar seus hobbies, conversar sobre seus assuntos favoritos e fazer parte de grupos com interesses em comum.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-semibold text-violet-600 dark:text-violet-400">
              <span>Clubes de livros, cinema, games e mais</span>
            </div>
          </div>

          {/* CARD 3 — RESPEITO EM PRIMEIRO LUGAR */}
          <div className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-teal-400/80 dark:hover:border-teal-500/50 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Card 3
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  RESPEITO EM PRIMEIRO LUGAR
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Uma comunidade 18+ com regras claras, ferramentas de proteção e compromisso com o respeito entre os participantes.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-semibold text-teal-600 dark:text-teal-400">
              <span>Zero tolerância para assédio ou paqueras</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final Banner CTA */}
      <section className="py-16 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Pronto para fazer parte de amizades que duram?
          </h3>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
            Cadastre-se agora mesmo em menos de 1 minuto e comece a descobrir pessoas que combinam com seu jeito de ser.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-base transition shadow-lg shadow-teal-500/30"
          >
            Quero Fazer Boas Amizades
          </button>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="SÓ AMIZADE Logo" className="w-8 h-8" />
              <div>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">SÓ AMIZADE</p>
                <p className="text-[11px] text-slate-400">Amizades verdadeiras começam aqui • 18+</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <span className="text-teal-600 dark:text-teal-400">
                Suporte Oficial: tecnomail09@gmail.com
              </span>
              <button
                type="button"
                onClick={() => openSupportModal('Dúvida Geral')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Falar com o Suporte</span>
              </button>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <p>© {new Date().getFullYear()} SÓ AMIZADE. Todos os direitos reservados. Conformidade LGPD (Lei nº 13.709/2018).</p>
            <p className="text-slate-400">Ambiente exclusivo para maiores de 18 anos.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
