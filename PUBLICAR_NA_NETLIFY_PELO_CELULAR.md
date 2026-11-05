# Publicar o SÓ AMIZADE pelo celular (GitHub + Netlify)

## Preparar os arquivos

1. Abra o ZArchiver e localize `SO-AMIZADE-GITHUB-NETLIFY.zip`.
2. Toque no arquivo e escolha **Extrair para uma pasta**.
3. Entre na pasta extraída. `package.json`, `netlify.toml`, `src`, `public` e `netlify` devem aparecer diretamente nela.
4. Não envie apenas `dist/` nem o arquivo ZIP como se fosse o conteúdo do site.

## Enviar para o GitHub

Envie o conteúdo da pasta extraída para a raiz do repositório `so-amizade-app`. Preserve o caminho `netlify/functions/verify-age.mjs`. Antes de confirmar no GitHub, confira se os arquivos e pastas selecionados correspondem ao projeto inteiro.

## Conectar a Netlify

1. Abra https://app.netlify.com/login.
2. Escolha **Add new site → Import an existing project → GitHub**.
3. Selecione `so-amizade-app`.
4. Confirme `npm run build` e `dist`. O `netlify.toml` também configura a pasta `netlify/functions`.
5. Use Node.js 22 e execute o deploy.

**Importante:** não use o Netlify Drop para esta versão. A função de idade não fica dentro de `dist/`; ela precisa ser publicada pelo processamento do repositório conectado ao Git.

## Conferir a função

Abra `https://SEU-SITE.netlify.app/.netlify/functions/verify-age`. A resposta esperada é JSON HTTP 200 com `ok: true`. Depois, teste o cadastro com uma data de adulto e uma data de menor de 18 anos.

## Autorizar o domínio no Firebase

No Firebase Console, abra **Authentication → Settings → Authorized domains** e adicione `SEU-SITE.netlify.app`, sem protocolo nem caminho. Confirme que Google e E-mail/Senha estão habilitados.
