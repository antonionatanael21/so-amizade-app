# SÓ AMIZADE — pacote para GitHub + Netlify

Este pacote foi preparado para publicar o projeto pelo repositório GitHub conectado à Netlify. Ele contém o código-fonte, `netlify.toml` e a função de servidor para validação de idade.

## 1. Extrair no Android

1. Abra o ZArchiver e localize `SO-AMIZADE-GITHUB-NETLIFY.zip`.
2. Toque no ZIP e escolha **Extrair para uma pasta**.
3. Abra a pasta extraída. No primeiro nível devem aparecer `package.json`, `netlify.toml`, `netlify/`, `src/` e `public/`.
4. Não entre em `dist/`: essa pasta não contém a função de servidor.

## 2. Enviar para o GitHub

Envie os itens de dentro da pasta extraída para a raiz do repositório `so-amizade-app`. Não envie somente o ZIP como um arquivo comum. `package.json` e `netlify.toml` precisam ficar diretamente na raiz do repositório, e a pasta `netlify/functions/verify-age.mjs` precisa manter esse caminho exato.

Se o GitHub mostrar uma lista de arquivos antes da confirmação, confira se aparecem os arquivos de raiz e as pastas `src`, `public` e `netlify`. Não confirme se o seletor tiver escolhido apenas o ZIP ou apenas `dist/`.

## 3. Conectar o GitHub à Netlify

1. Entre em https://app.netlify.com/login.
2. Escolha **Add new site → Import an existing project → GitHub**.
3. Autorize a Netlify a acessar o repositório `so-amizade-app` e selecione-o.
4. Use **Build command** `npm run build` e **Publish directory** `dist`. O `netlify.toml` já traz essas configurações e aponta as funções para `netlify/functions`.
5. Mantenha Node.js 22, conforme `.nvmrc` e `netlify.toml`, e inicie o deploy.

**Não use o Netlify Drop nem publique apenas `dist/` para este pacote.** O deploy precisa processar o repositório conectado ao Git para empacotar também a função serverless.

## 4. Testar a função após o deploy

Abra `https://SEU-SITE.netlify.app/.netlify/functions/verify-age`, substituindo `SEU-SITE` pelo subdomínio real. O resultado esperado é JSON HTTP 200 com `ok: true`.

Se aparecer 404, confira nos detalhes do deploy se `verify-age` aparece em **Functions**, se `netlify/functions/verify-age.mjs` está na raiz do repositório e se o `netlify.toml` foi enviado.

## 5. Configurar o Firebase

No https://console.firebase.google.com/, selecione o projeto indicado em `firebase-applet-config.json`:

1. Ative E-mail/Senha e Google em **Authentication → Sign-in method**.
2. Adicione o domínio exato `SEU-SITE.netlify.app` em **Authentication → Settings → Authorized domains**.
3. Confirme que Firestore e Storage existem e publique `firestore.rules` e `storage.rules` depois de revisar as permissões.

O ZIP não consegue alterar configurações diretamente nas contas GitHub, Netlify, Firebase ou Google.
