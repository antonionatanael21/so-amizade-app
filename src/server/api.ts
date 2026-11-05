import express, { Request, Response, Router } from 'express';
import { calculateAge } from '../utils/age';

export const apiRouter = Router();

apiRouter.use(express.json());

// Optional API endpoints. Features that need durable storage, verified delivery,
// or payment-signature validation stay explicitly disabled until a trusted backend
// and a real provider integration are configured.
const serviceUnavailable = (feature: string) => (_req: Request, res: Response) =>
  res.status(503).json({
    success: false,
    error: `${feature} não está configurado neste ambiente.`,
    supportEmail: 'tecnomail09@gmail.com',
  });

apiRouter.post('/support/ticket', serviceUnavailable('O envio automático de suporte'));
apiRouter.get('/support/tickets', serviceUnavailable('O histórico persistente de chamados'));
apiRouter.post('/auth/send-reset-code', serviceUnavailable('A recuperação por código personalizado; use a recuperação nativa do Firebase'));
apiRouter.post('/auth/verify-reset-code', serviceUnavailable('A recuperação por código personalizado; use a recuperação nativa do Firebase'));
apiRouter.post('/auth/confirm-code-reset', serviceUnavailable('A recuperação por código personalizado; use a recuperação nativa do Firebase'));
apiRouter.post('/auth/send-welcome', serviceUnavailable('O envio de e-mails de boas-vindas'));
apiRouter.post('/auth/send-deletion-notice', serviceUnavailable('O envio automático de avisos de exclusão'));
apiRouter.get('/email/templates/preview', serviceUnavailable('A prévia de modelos de e-mail'));
apiRouter.get('/domain/status', (_req: Request, res: Response) => res.status(501).json({
  configured: false,
  message: 'Configure e valide o domínio no Firebase Console e no provedor DNS. Este endpoint não executa diagnóstico de DNS.',
}));

// Health check endpoint
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'SÓ AMIZADE API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Server-side Age Verification endpoint (Requirement 3: Implemente validação de idade no servidor)
function getRecifeReferenceDate(): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Recife',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day), 12);
}

apiRouter.post('/verify-age', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  const { birthDate } = req.body ?? {};
  if (!birthDate) {
    return res.status(400).json({ error: 'Data de nascimento é obrigatória.' });
  }

  const result = calculateAge(birthDate, getRecifeReferenceDate());
  if (!result.isValid) {
    return res.status(403).json({
      valid: false,
      age: result.age,
      error: result.error || 'Menor de 18 anos não permitido no SÓ AMIZADE.',
    });
  }

  return res.json({
    valid: true,
    age: result.age,
    message: 'Idade validada com sucesso pelo servidor.',
  });
});

// Mercado Pago stays disabled until the backend authenticates Firebase users,
// uses server-side plan prices, and validates the provider's signed webhook.
apiRouter.get('/mercadopago/status', (_req: Request, res: Response) => res.json({
  configured: false,
  provider: 'mercadopago',
  message: 'Checkout indisponível: integração segura de pagamento ainda não foi implantada.',
}));

apiRouter.post('/mercadopago/create-preference', serviceUnavailable('O checkout do Mercado Pago'));
apiRouter.post('/mercadopago/webhook', serviceUnavailable('O webhook de pagamento autenticado'));
