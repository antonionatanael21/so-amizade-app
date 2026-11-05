/**
 * Pricing and Subscription definitions for SÓ AMIZADE.
 * Default pricing:
 * - Monthly: R$ 9,90
 * - Annual: R$ 99,00 (Save ~17%)
 */

export interface PricingPlan {
  id: 'plus_monthly' | 'plus_annual';
  name: string;
  badge: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  discountBadge?: string;
}

export const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: 'plus_monthly',
    name: 'SÓ AMIZADE+ Mensal',
    badge: 'PLUS',
    price: 9.90,
    period: 'month',
    description: 'Acesso completo a todas as personalizações e recursos avançados mês a mês.',
    features: [
      'Selo dourado exclusivo no perfil',
      'Temas visuais e capas gradiente personalizadas',
      'Filtros ilimitados no Descobrir Amigos',
      'Navegação 100% sem anúncios',
      'Criação de até 15 comunidades',
      'Destaque com prioridade nas sugestões de amizade'
    ]
  },
  {
    id: 'plus_annual',
    name: 'SÓ AMIZADE+ Anual',
    badge: 'MELHOR VALOR',
    price: 99.00,
    period: 'year',
    discountBadge: 'Economize 17% (2 meses grátis)',
    description: 'Um ano inteiro de conexões sem limites com desconto especial.',
    features: [
      'Todos os benefícios do plano mensal',
      '2 meses de cortesia inclusos',
      'Selo de apoiador pioneiro da comunidade',
      'Prioridade na fila de suporte',
      'Acesso antecipado a novos recursos sociais'
    ]
  }
];

export function formatCurrencyBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}
