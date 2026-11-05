# Publicar o SÓ AMIZADE na Netlify pelo GitHub

1. Extraia `SO-AMIZADE-GITHUB-NETLIFY.zip` pelo ZArchiver.
2. Envie o conteúdo da pasta extraída para a raiz do repositório GitHub `so-amizade-app`. Não coloque o projeto dentro de outra pasta e não envie apenas `dist/`.
3. Confirme que `package.json`, `netlify.toml`, `src/`, `public/` e `netlify/functions/verify-age.mjs` estão no caminho correto.
4. Na Netlify, use **Add new site → Import an existing project → GitHub** e selecione o repositório.
5. Configure `npm run build` como comando e `dist` como diretório de publicação. O arquivo `netlify.toml` já contém essas definições.
6. Use Node.js 22 e inicie o deploy.
7. Depois, teste `https://SEU-SITE.netlify.app/.netlify/functions/verify-age`. Deve responder JSON HTTP 200 com `ok: true`.

**Não publique pelo Netlify Drop nem envie somente `dist/`**: a função serverless de idade precisa ser processada junto com o repositório-fonte conectado ao Git.

No Firebase Console, adicione o domínio exato do site em **Authentication → Settings → Authorized domains** e confirme os provedores Google e E-mail/Senha.
