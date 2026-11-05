import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { DEFAULT_PLANS, formatCurrencyBRL, PricingPlan } from '../utils/pricing';
import {
  Sparkles,
  Check,
  ShieldCheck,
  CreditCard,
  QrCode,
  Zap,
  HelpCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const PricingPlansView: React.FC = () => {
  const { profile } = useAuth();
  const { showToast } = useUI();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(DEFAULT_PLANS[0]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const isGatewayConfigured = false; // Payments stay disabled until a verified server-side checkout and webhook are deployed.

  const handleOpenCheckout = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setShowCheckoutModal(true);
  };

  const handleInitiateCheckout = async () => {
    showToast(
      'As assinaturas pagas ainda não estão disponíveis. O pagamento será ativado somente após a implantação de checkout e webhook verificados no servidor.',
      'info'
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 md:pb-8">
      {/* Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto pt-4">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>SÓ AMIZADE+ • Assinatura Sustentável</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Apoie nossa comunidade e desbloqueie vantagens exclusivas
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nossa rede é sustentável e valoriza você. O plano gratuito sempre terá todos os recursos essenciais de conversa e amizade.
        </p>
      </div>

      {/* Plan Cards Comparison */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* FREE PLAN */}
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                Plano Gratuito
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Para Sempre
              </span>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                R$ 0
              </span>
              <span className="text-xs text-slate-400"> /mês</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tudo o que você precisa para fazer amigos sinceros, trocar mensagens e participar de comunidades.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-2">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Cadastro e perfil completo com interesses</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Publicações ilimitadas no Feed</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Mensagens diretas ilimitadas com amigos</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Entrar em comunidades temáticas</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Proteção e segurança 18+ ativa</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-center text-xs font-bold text-slate-400 py-2">
              {profile?.plan === 'free' ? 'Seu plano atual' : 'Plano Básico'}
            </span>
          </div>
        </div>

        {/* PREMIUM SÓ AMIZADE+ */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-indigo-950/20 via-purple-950/20 to-teal-950/20 dark:from-slate-900 dark:to-indigo-950/40 rounded-3xl border-2 border-amber-400/80 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-amber-500 to-teal-500 text-slate-950 text-[10px] font-extrabold uppercase rounded-full tracking-wider shadow">
            Destaque
          </div>

          <div className="space-y-4">
            <h3 className="font-extrabold text-xl text-amber-600 dark:text-amber-400 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>SÓ AMIZADE+</span>
            </h3>

            <div className="space-y-1">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl sm:text-4xl font-extrabold">
                  {formatCurrencyBRL(selectedPlan.price)}
                </span>
                <span className="text-xs text-slate-400">
                  /{selectedPlan.period === 'month' ? 'mês' : 'ano'}
                </span>
              </div>
              {selectedPlan.discountBadge && (
                <span className="inline-block text-[11px] font-bold text-teal-600 dark:text-teal-400">
                  {selectedPlan.discountBadge}
                </span>
              )}
            </div>

            {/* Toggle Monthly / Annual */}
            <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setSelectedPlan(DEFAULT_PLANS[0])}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  selectedPlan.id === 'plus_monthly'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mensal (R$ 9,90)
              </button>
              <button
                onClick={() => setSelectedPlan(DEFAULT_PLANS[1])}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  selectedPlan.id === 'plus_annual'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Anual (R$ 99,00)
              </button>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 pt-2">
              {selectedPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-center space-x-2 font-medium">
                  <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {profile?.plan === 'plus' ? (
              <div className="text-center p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold text-xs">
                Sua assinatura SÓ AMIZADE+ está ativa!
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleOpenCheckout(selectedPlan)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-teal-500 hover:opacity-95 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  Assinar {selectedPlan.name}
                </button>
                {isGatewayConfigured === false && (
                  <p className="text-[11px] text-center text-slate-400">
                    Integração Mercado Pago ainda não implementada com segurança
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mercado Pago Architecture & Payment Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-lg">Checkout • {selectedPlan.name}</h3>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-sm">
                <span>Total a pagar:</span>
                <span className="text-teal-600">{formatCurrencyBRL(selectedPlan.price)}</span>
              </div>
              <p className="text-slate-500">
                Processamento oficial via <strong>Mercado Pago</strong> com suporte a Pix e Cartão de Crédito.
              </p>
            </div>

            {/* Gateway status notice */}
            {isGatewayConfigured === false ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center space-x-2 font-bold text-amber-900 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Pagamentos ainda não disponíveis</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                  O checkout só será habilitado após implementar autenticação de usuário no servidor, preço fixo no backend e validação de webhook. Nenhuma cobrança ou ativação de plano é realizada nesta versão.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <p className="font-bold">Arquitetura de Pagamentos Segura:</p>
                <p className="text-[11px] leading-relaxed">
                  Esta integração ainda não foi implantada. Nenhuma cobrança será iniciada e nenhum benefício pago será liberado nesta versão.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!isGatewayConfigured}
                onClick={handleInitiateCheckout}
                className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {'Checkout Indisponível'}
                </span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
