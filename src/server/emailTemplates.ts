/**
 * SÓ AMIZADE — Modelos de E-mail HTML Profissionais e Responsivos
 * Identidade visual: Slate (#0f172a), Teal (#0d9488), Índigo (#4f46e5), Dourado (#f59e0b)
 * Canal oficial de suporte e notificações: tecnomail09@gmail.com
 */

export interface EmailTemplateData {
  appName?: string;
  supportEmail?: string;
  baseUrl?: string;
}

const DEFAULT_SUPPORT_EMAIL = 'tecnomail09@gmail.com';
const APP_NAME = 'SÓ AMIZADE';
const BASE_URL = 'https://soamizade.com.br';

function baseEmailWrapper(content: string, preheaderText: string = ''): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    a { color: #14b8a6; text-decoration: none; }
    .btn-primary {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #4f46e5 0%, #0d9488 100%);
      color: #ffffff !important;
      font-weight: 700;
      font-size: 15px;
      border-radius: 12px;
      text-decoration: none;
      letter-spacing: 0.3px;
    }
    .code-box {
      background: #1e293b;
      border: 2px dashed #0d9488;
      border-radius: 16px;
      padding: 24px 20px;
      text-align: center;
      margin: 25px 0;
    }
    .code-digits {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #38bdf8;
      margin: 0;
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0b0f19;">
  ${preheaderText ? `<div style="display:none;font-size:1px;color:#0b0f19;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheaderText}</div>` : ''}
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #111827; border-radius: 24px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);" cellpadding="0" cellspacing="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #042f2e 100%); padding: 36px 32px 28px; text-align: center; border-bottom: 1px solid #1f2937;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #0d9488); padding: 12px 18px; border-radius: 18px; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
                      <span style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 1.5px;">SÓ AMIZADE</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="display: inline-block; background-color: rgba(13, 148, 136, 0.2); border: 1px solid #0d9488; color: #2dd4bf; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px;">
                      Comunidade 18+ • Amizades Verdadeiras
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 24px; color: #e2e8f0; font-size: 15px; line-height: 1.65;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0d131f; padding: 28px 32px; border-top: 1px solid #1f2937; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 10px; font-weight: 700; color: #cbd5e1; font-size: 13px;">
                ${APP_NAME} — A rede social para quem busca amizades reais
              </p>
              <p style="margin: 0 0 14px;">
                Dúvidas ou suporte? Escreva para nossa equipe em: 
                <a href="mailto:${DEFAULT_SUPPORT_EMAIL}" style="color: #38bdf8; font-weight: 600;">${DEFAULT_SUPPORT_EMAIL}</a>
              </p>
              <p style="margin: 0 0 14px; font-size: 11px; color: #64748b;">
                Ambiente 100% em conformidade com a LGPD (Lei nº 13.709/2018). Protegemos seus dados e sua privacidade.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                © ${new Date().getFullYear()} ${APP_NAME}. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Template: E-mail de Boas-Vindas (Welcome Email)
 */
export function getWelcomeEmailTemplate(data: {
  userName: string;
  userEmail: string;
  loginUrl?: string;
}): { subject: string; html: string; text: string } {
  const userName = data.userName || 'Novo Membro';
  const loginUrl = data.loginUrl || `${BASE_URL}/login`;

  const subject = `Bem-vindo(a) ao SÓ AMIZADE, ${userName}! Amizades verdadeiras começam aqui.`;

  const html = baseEmailWrapper(`
    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 16px; text-align: center;">
      É uma honra receber você no ${APP_NAME}! 🎉
    </h1>
    
    <p style="margin: 0 0 18px;">
      Olá, <strong style="color: #38bdf8;">${userName}</strong>,
    </p>

    <p style="margin: 0 0 18px;">
      Sua conta foi criada com sucesso! O <strong>${APP_NAME}</strong> foi construído especialmente para pessoas que valorizam conexões reais, conversas saudáveis e afinidades sinceras, sem o estresse, a superficialidade ou a pressão de aplicativos de namoro.
    </p>

    <div style="background-color: #1e293b; border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid #334155;">
      <h3 style="margin: 0 0 14px; color: #f59e0b; font-size: 15px; font-weight: 700;">
        🌟 3 Passos para começar sua jornada:
      </h3>
      <ol style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
        <li><strong style="color: #ffffff;">Complete seu perfil:</strong> Adicione sua biografia e selecione seus hobbies favoritos.</li>
        <li><strong style="color: #ffffff;">Participe de comunidades:</strong> Entre nos grupos de cinema, esportes, tecnologia, livros ou música.</li>
        <li><strong style="color: #ffffff;">Faça conexões:</strong> Envie solicitações de amizade respeitosas para membros com gostos semelhantes.</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 32px 0 24px;">
      <a href="${loginUrl}" class="btn-primary">
        Acessar Minha Conta Agora →
      </a>
    </div>

    <div style="background-color: rgba(13, 148, 136, 0.1); border-left: 4px solid #0d9488; padding: 14px 18px; border-radius: 0 12px 12px 0; margin: 20px 0 10px;">
      <p style="margin: 0; font-size: 13px; color: #99f6e4;">
        <strong>Compromisso de Respeito:</strong> Nossa comunidade é estritamente 18+. Mantemos tolerância zero para assédio, mensagens desrespeitosas ou propostas inadequadas.
      </p>
    </div>
  `, `Olá ${userName}, sua conta no SÓ AMIZADE está pronta. Conecte-se com pessoas de verdade.`);

  const text = `Olá ${userName}, bem-vindo(a) ao SÓ AMIZADE! Sua conta foi criada com sucesso. Acesse: ${loginUrl}. Suporte: ${DEFAULT_SUPPORT_EMAIL}`;

  return { subject, html, text };
}

/**
 * 2. Template: Código de 6 Dígitos para Redefinição de Senha
 */
export function getResetCodeEmailTemplate(data: {
  userName?: string;
  code: string;
  expiresInMinutes?: number;
}): { subject: string; html: string; text: string } {
  const code = data.code || '000000';
  const minutes = data.expiresInMinutes || 15;
  const userName = data.userName || 'Membro do SÓ AMIZADE';

  const subject = `Código de Segurança: ${code} — Recuperação de Senha no SÓ AMIZADE`;

  const html = baseEmailWrapper(`
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
        🔒 Segurança da Conta
      </span>
    </div>

    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 14px; text-align: center;">
      Recuperação de Senha
    </h1>
    
    <p style="margin: 0 0 16px;">
      Olá, <strong style="color: #38bdf8;">${userName}</strong>,
    </p>

    <p style="margin: 0 0 16px;">
      Recebemos uma solicitação para redefinir a senha da sua conta no <strong>${APP_NAME}</strong>. Para prosseguir, insira o código de verificação de 6 dígitos abaixo na tela de recuperação:
    </p>

    <div class="code-box">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
        Seu Código de Verificação
      </p>
      <p class="code-digits">${code}</p>
      <p style="margin: 12px 0 0; font-size: 12px; color: #f59e0b; font-weight: 600;">
        ⏱️ Este código expira em ${minutes} minutos.
      </p>
    </div>

    <div style="background-color: #1e293b; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #334155;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #f1f5f9;">
        ⚠️ Dicas importantes de segurança:
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #94a3b8; line-height: 1.7;">
        <li>Nunca compartilhe este código com ninguém, nem mesmo com a equipe do SÓ AMIZADE.</li>
        <li>Nenhum administrador solicitará seu código por mensagem ou ligação.</li>
        <li>Se você <strong>não</strong> solicitou a redefinição de senha, desconsidere este e-mail. Sua conta permanece segura.</li>
      </ul>
    </div>

    <p style="margin: 16px 0 0; font-size: 12px; color: #64748b; text-align: center;">
      Caso precise de ajuda imediata, nosso suporte atende em: <a href="mailto:${DEFAULT_SUPPORT_EMAIL}">${DEFAULT_SUPPORT_EMAIL}</a>
    </p>
  `, `Seu código de recuperação no SÓ AMIZADE é: ${code} (válido por ${minutes} minutos).`);

  const text = `Seu código de segurança para redefinir a senha no SÓ AMIZADE é: ${code}. Válido por ${minutes} minutos. Se você não solicitou, ignore esta mensagem. Suporte: ${DEFAULT_SUPPORT_EMAIL}`;

  return { subject, html, text };
}

/**
 * 3. Template: Confirmação de Exclusão de Conta (LGPD Erasure Confirmation)
 */
export function getAccountDeletionEmailTemplate(data: {
  userName: string;
  userEmail: string;
  deletedAt?: string;
}): { subject: string; html: string; text: string } {
  const userName = data.userName || 'Membro';
  const deletedAt = data.deletedAt || new Date().toLocaleString('pt-BR');

  const subject = `Confirmação de Exclusão de Conta e Dados — SÓ AMIZADE (LGPD)`;

  const html = baseEmailWrapper(`
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: rgba(148, 163, 184, 0.15); border: 1px solid #475569; color: #94a3b8; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
        🛡️ Conformidade LGPD • Art. 18
      </span>
    </div>

    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 16px; text-align: center;">
      Sua conta foi excluída com sucesso
    </h1>
    
    <p style="margin: 0 0 16px;">
      Olá, <strong style="color: #cbd5e1;">${userName}</strong>,
    </p>

    <p style="margin: 0 0 16px;">
      Confirmamos que a exclusão definitiva da sua conta no <strong>${APP_NAME}</strong> foi processada em <strong>${deletedAt}</strong>, em estrito cumprimento ao seu direito de eliminação de dados previsto na <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>.
    </p>

    <div style="background-color: #1e293b; border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid #334155;">
      <h3 style="margin: 0 0 12px; color: #38bdf8; font-size: 14px; font-weight: 700;">
        📋 Registro do processo de exclusão:
      </h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #cbd5e1; line-height: 1.8;">
        <li>Seu perfil público, biografia e fotografias foram removidos permanentemente.</li>
        <li>Suas publicações, comentários e curtidas foram desvinculados ou apagados.</li>
        <li>Suas conexões e conversas diretas foram encerradas e desindexadas.</li>
        <li>Eventual assinatura recorrente ativa foi cancelada sem novas cobranças.</li>
      </ul>
    </div>

    <p style="margin: 0 0 18px;">
      Agradecemos sinceramente pelo tempo em que você fez parte da comunidade do <strong>${APP_NAME}</strong>. Se no futuro você desejar retornar, saiba que as nossas portas estarão sempre abertas para receber você novamente.
    </p>

    <div style="background-color: rgba(56, 189, 248, 0.08); border-radius: 12px; padding: 14px 18px; border: 1px solid rgba(56, 189, 248, 0.2); margin: 20px 0;">
      <p style="margin: 0; font-size: 12px; color: #bae6fd;">
        Para qualquer dúvida jurídica ou técnica relacionada à custódia de dados, nosso canal do Encarregado de Proteção de Dados (DPO) atende em: <strong>${DEFAULT_SUPPORT_EMAIL}</strong>.
      </p>
    </div>
  `, `Sua conta no SÓ AMIZADE foi excluída definitivamente em ${deletedAt}. Seus dados foram removidos conforme a LGPD.`);

  const text = `Olá ${userName}, confirmamos que sua conta no SÓ AMIZADE e seus dados foram excluídos com sucesso em ${deletedAt} sob a LGPD. Suporte: ${DEFAULT_SUPPORT_EMAIL}`;

  return { subject, html, text };
}

/**
 * 4. Template: Notificação de Chamado de Suporte (Despachado para tecnomail09@gmail.com)
 */
export function getSupportAdminNotificationTemplate(data: {
  ticketId: string;
  userName: string;
  userEmail: string;
  category: string;
  subject: string;
  message: string;
  createdAt?: string;
}): { subject: string; html: string; text: string } {
  const ticketId = data.ticketId || `TK-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = data.createdAt || new Date().toLocaleString('pt-BR');
  const userSubject = data.subject || 'Dúvida Geral';

  const subject = `[Suporte SÓ AMIZADE #${ticketId}] ${data.category}: ${userSubject}`;

  const html = baseEmailWrapper(`
    <div style="text-align: center; margin-bottom: 18px;">
      <span style="display: inline-block; background-color: rgba(13, 148, 136, 0.2); border: 1px solid #0d9488; color: #2dd4bf; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
        🎫 Novo Chamado de Suporte #${ticketId}
      </span>
    </div>

    <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0 0 18px; text-align: center;">
      Mensagem Recebida via App SÓ AMIZADE
    </h1>

    <div style="background-color: #1e293b; border-radius: 16px; padding: 20px; margin: 20px 0; border: 1px solid #334155;">
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; color: #cbd5e1;">
        <tr>
          <td width="30%" style="font-weight: 700; color: #94a3b8;">Remetente:</td>
          <td style="color: #ffffff; font-weight: 600;">${data.userName}</td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #94a3b8;">E-mail do Usuário:</td>
          <td><a href="mailto:${data.userEmail}" style="color: #38bdf8; font-weight: 600;">${data.userEmail}</a></td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #94a3b8;">Categoria:</td>
          <td>
            <span style="display: inline-block; background-color: #334155; color: #f59e0b; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">
              ${data.category}
            </span>
          </td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #94a3b8;">Assunto:</td>
          <td style="color: #f1f5f9; font-weight: 600;">${userSubject}</td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #94a3b8;">Data / Hora:</td>
          <td style="color: #94a3b8;">${dateStr}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #0f172a; border-radius: 16px; padding: 22px; border: 1px solid #1e293b; margin: 22px 0;">
      <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0d9488; letter-spacing: 0.5px;">
        Conteúdo da Mensagem:
      </p>
      <div style="font-size: 14px; line-height: 1.7; color: #f8fafc; white-space: pre-wrap;">
${data.message}
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0 10px;">
      <a href="mailto:${data.userEmail}?subject=Re: [Suporte SÓ AMIZADE #${ticketId}] ${encodeURIComponent(userSubject)}" class="btn-primary">
        ✉️ Responder ao Usuário (${data.userEmail})
      </a>
    </div>
  `, `Novo chamado #${ticketId} de ${data.userName} (${data.userEmail}): ${userSubject}`);

  const text = `Novo chamado #${ticketId} recebido no SÓ AMIZADE.\nRemetente: ${data.userName} (${data.userEmail})\nCategoria: ${data.category}\nAssunto: ${userSubject}\nMensagem:\n${data.message}`;

  return { subject, html, text };
}

/**
 * 5. Template: Recibo de Chamado para o Usuário
 */
export function getSupportUserReceiptTemplate(data: {
  ticketId: string;
  userName: string;
  category: string;
  subject: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const ticketId = data.ticketId;
  const userName = data.userName || 'Membro';

  const subject = `Recebemos sua mensagem — Suporte SÓ AMIZADE #${ticketId}`;

  const html = baseEmailWrapper(`
    <div style="text-align: center; margin-bottom: 18px;">
      <span style="display: inline-block; background-color: rgba(13, 148, 136, 0.2); border: 1px solid #0d9488; color: #2dd4bf; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
        ✓ Solicitação Registrada
      </span>
    </div>

    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 14px; text-align: center;">
      Recebemos sua mensagem!
    </h1>
    
    <p style="margin: 0 0 16px;">
      Olá, <strong style="color: #38bdf8;">${userName}</strong>,
    </p>

    <p style="margin: 0 0 16px;">
      Seu chamado de suporte foi registrado com o protocolo <strong>#${ticketId}</strong> e já foi encaminhado para nossa equipe técnica em <strong>${DEFAULT_SUPPORT_EMAIL}</strong>.
    </p>

    <div style="background-color: #1e293b; border-radius: 16px; padding: 18px; margin: 20px 0; border: 1px solid #334155;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #f59e0b;">
        Resumo do seu atendimento:
      </p>
      <p style="margin: 0 0 4px; font-size: 13px; color: #cbd5e1;"><strong>Protocolo:</strong> #${ticketId}</p>
      <p style="margin: 0 0 4px; font-size: 13px; color: #cbd5e1;"><strong>Categoria:</strong> ${data.category}</p>
      <p style="margin: 0 0 4px; font-size: 13px; color: #cbd5e1;"><strong>Assunto:</strong> ${data.subject}</p>
      <p style="margin: 10px 0 0; font-size: 12px; color: #94a3b8; font-style: italic;">
        "${data.message.length > 120 ? data.message.substring(0, 120) + '...' : data.message}"
      </p>
    </div>

    <p style="margin: 0 0 14px;">
      Nosso tempo médio de resposta é de até <strong>24 horas úteis</strong>. Responderemos diretamente ao seu e-mail cadastrado.
    </p>

    <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
      Se precisar complementar informações, você também pode nos escrever em <a href="mailto:${DEFAULT_SUPPORT_EMAIL}">${DEFAULT_SUPPORT_EMAIL}</a> mencionando o protocolo #${ticketId}.
    </p>
  `, `Chamado #${ticketId} registrado no SÓ AMIZADE. Responderemos em breve.`);

  const text = `Olá ${userName}, recebemos seu chamado #${ticketId} no SÓ AMIZADE. Responderemos em até 24 horas úteis. Suporte: ${DEFAULT_SUPPORT_EMAIL}`;

  return { subject, html, text };
}
