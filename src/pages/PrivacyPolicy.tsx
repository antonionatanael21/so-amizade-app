import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

export const PrivacyPolicy: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 pb-20 md:pb-10">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </button>

      <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Política de Privacidade (LGPD)
        </h1>
        <p className="text-xs text-slate-400">
          Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
        </p>
      </div>

      <div className="prose dark:prose-invert text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          1. Princípio da Minimização e Coleta de Dados
        </h3>
        <p>
          O <strong>SÓ AMIZADE</strong> coleta apenas os dados estritamente necessários para viabilizar a experiência de conexões amistosas seguras:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Dados cadastrais:</strong> Nome de exibição, nome de usuário único, e-mail e senha criptografada.</li>
          <li><strong>Data de nascimento:</strong> Coletada para fins exclusivos de validação legal da idade mínima de 18 anos. A data de nascimento é tratada como informação privada e <strong>nunca é exibida publicamente</strong>.</li>
          <li><strong>Dados de perfil e interesses:</strong> Cidade, estado, preferências artísticas, hobbies e tópicos de conversa informados espontaneamente pelo usuário para facilitar a descoberta de afinidades.</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          2. Seus Direitos como Titular (Art. 18 da LGPD)
        </h3>
        <p>Você pode, a qualquer tempo e sem qualquer custo:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Acessar e Exportar:</strong> Baixar um arquivo JSON com os dados de perfil e identidade incluídos nesta versão. Mensagens, publicações e parte do histórico social ainda não fazem parte da exportação automática; solicite informações complementares pelo canal de suporte.</li>
          <li><strong>Retificação:</strong> Corrigir informações incompletas ou desatualizadas no seu perfil.</li>
          <li><strong>Eliminação:</strong> Solicitar a exclusão integral pelo e-mail tecnomail09@gmail.com. O pedido será encaminhado à equipe para análise e execução; o botão de solicitação não apaga a conta automaticamente nem confirma que a exclusão já ocorreu.</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          3. Segurança e Sigilo Absoluto
        </h3>
        <p>
          A aplicação utiliza serviços de terceiros para autenticação, hospedagem e armazenamento (incluindo Firebase/Google e Netlify). Esses provedores processam dados conforme suas próprias condições e políticas. O acesso a conversas privadas é limitado aos participantes autorizados pelas regras da aplicação; não envie informações sensíveis que não sejam necessárias.
        </p>
      </div>
    </div>
  );
};
