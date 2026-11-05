# SÓ AMIZADE — rede social de amizades (18+)

Aplicação web responsiva construída com React, TypeScript, Vite, Tailwind CSS e Firebase. O frontend é publicado na Netlify e a validação de idade é executada por uma Netlify Function.

> Este repositório contém o código-fonte e a função de idade. Ele não configura automaticamente serviços externos nem substitui a revisão das regras do Firebase antes do lançamento.

## Estrutura importante

- `src/`: interface, páginas, autenticação, serviços e utilitários.
- `netlify/functions/verify-age.mjs`: função serverless usada no cadastro para validar a data de nascimento.
- `netlify.toml`: comando de build, pasta publicada, diretório de funções, cabeçalhos e redirects.
- `package.json`: scripts e dependências do projeto.
- `firebase-applet-config.json`: configuração pública usada pelo frontend.
- `firestore.rules` e `storage.rules`: regras que precisam ser revisadas e publicadas no projeto Firebase.

## Publicar usando GitHub + Netlify

1. Envie o conteúdo desta pasta para a raiz do repositório GitHub. `package.json` e `netlify.toml` devem ficar na raiz, sem uma pasta externa envolvendo o projeto.
2. Na Netlify, escolha **Add new site → Import an existing project → GitHub** e autorize o acesso ao repositório.
3. Se a Netlify pedir configurações, use **Build command** `npm run build` e **Publish directory** `dist`. O `netlify.toml` já contém essas configurações e define `netlify/functions` como diretório das funções.
4. Mantenha o Node.js na versão 22, conforme `netlify.toml` e `.nvmrc`.
5. Conclua o deploy e abra a URL do site.

**Não publique somente `dist/` e não faça deploy manual de uma pasta estática para esta versão.** A função de idade está fora de `dist/`; a Netlify precisa processar o repositório-fonte conectado ao Git para compilar e publicar a função.

### Verificar a função depois do deploy

Abra `https://SEU-SITE.netlify.app/.netlify/functions/verify-age`, substituindo `SEU-SITE` pelo subdomínio real. A resposta esperada é JSON HTTP 200 com `ok: true`. A aplicação também mantém `/api/verify-age` como alias configurado em `netlify.toml`.

Se aparecer 404, abra os detalhes do deploy e confirme se `verify-age` aparece em **Functions**. Verifique também os logs de build e a presença de `netlify/functions/verify-age.mjs` no repositório.

## Testes e build local

```bash
npm install
npm test
npm run build
```

`npm run build` gera os arquivos estáticos em `dist`. No deploy conectado ao Git, a Netlify também empacota as funções do diretório `netlify/functions`.

O projeto ainda contém `server.ts` e uma API Express para desenvolvimento ou hospedagem Node tradicional. Esse servidor Express não é o backend publicado pelo deploy estático padrão da Netlify. A função Netlify de idade é o endpoint server-side incluído neste pacote.

## Configuração obrigatória do Firebase

No [Firebase Console](https://console.firebase.google.com/), abra o projeto referenciado em `firebase-applet-config.json` e confira:

1. **Authentication → Sign-in method:** ative E-mail/Senha e Google.
2. **Authentication → Settings → Authorized domains:** adicione o domínio exato fornecido pela Netlify (por exemplo, `seu-site.netlify.app`) e qualquer domínio próprio que configurar.
3. **Authentication → Templates:** revise o nome do aplicativo, e-mail de suporte e modelos de e-mail.
4. **Firestore Database:** confirme que o banco indicado na configuração existe e publique `firestore.rules` após revisar as permissões.
5. **Storage:** confirme que o bucket existe e publique `storage.rules` após revisar as permissões.

A chave web do Firebase presente na configuração do frontend é pública por natureza; a proteção depende das regras, da configuração de autenticação e dos controles do projeto. As regras incluídas devem ser revisadas e implantadas no Firebase antes do lançamento.

A validação de data de nascimento ocorre no cliente e na Netlify Function, mas não comprova identidade nem idade real: uma pessoa tecnicamente avançada pode manipular dados enviados pelo próprio navegador. Para uma barreira legal/técnica robusta, implemente um provedor confiável de verificação de idade/identidade e controles adicionais no backend.

## Administrador inicial

O código reconhece estes endereços como administradores de bootstrap:

- `tecnomail09@gmail.com`
- `antonionatanael140@gmail.com`

A promoção também depende da autenticação e das regras implantadas. Confirme o acesso no painel administrativo depois de entrar com a conta correspondente.

## Nome exibido no login do Google

O nome apresentado pela janela do Google, como “Continuar para gen-lang-client-…”, não é controlado pelo texto do React. Ajuste a identidade do aplicativo em **Google Cloud Console → Google Auth Platform / Branding**, revise e-mail de suporte e domínios autorizados e publique as alterações.

O `authDomain` ativo no arquivo de configuração é `gen-lang-client-0767997957.firebaseapp.com`. O domínio `login.soamizade.com.br` é apenas uma sugestão e não está configurado por este projeto. Só o utilize depois de configurá-lo e validá-lo no Firebase, no Google OAuth e no DNS.

## Recursos que ainda exigem serviços externos

- **Recuperação de senha:** utiliza o fluxo nativo do Firebase Authentication; personalize e teste o modelo de e-mail no Console.
- **Suporte:** o site abre um rascunho `mailto:` para `tecnomail09@gmail.com`. O usuário precisa confirmar o envio no aplicativo de e-mail. Não há envio automático nem histórico persistente de chamados.
- **Exclusão integral de conta:** ainda exige backend com Firebase Admin para remover Authentication, documentos, subcoleções e arquivos relacionados. O fluxo atual não deve ser interpretado como exclusão automática já concluída.
- **Mercado Pago / SÓ AMIZADE+:** checkout permanece desativado até existir autenticação segura no servidor, preços definidos no servidor, validação da assinatura do webhook e atualização idempotente do plano.
- **E-mails automáticos:** exigem provedor transacional e função segura de servidor; não estão habilitados nesta versão.

## LGPD e dados

A data de nascimento e o e-mail são armazenados em `users/{uid}/private/identity`, separados do documento público. Antes do lançamento, revise a Política de Privacidade e os Termos para refletirem o controlador, finalidades, bases legais, retenção, contato e serviços realmente ativados.
