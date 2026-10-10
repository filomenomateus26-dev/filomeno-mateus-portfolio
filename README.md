# Portfólio — Filomeno Mateus

Site estático bilingue (PT / EN), sem build e sem dependências. Basta enviar a pasta para um serviço de alojamento.

## Estrutura

```
index.html                 página única (conteúdo e estrutura)
404.html                   página de erro
assets/css/styles.css      estilos
assets/js/config.js        EMAIL, WHATSAPP, REDES SOCIAIS e FORMULÁRIO (edita aqui)
assets/js/translations.js  todos os textos em PT e EN (edita aqui)
assets/js/main.js          lógica (idioma, menu, formulário)
assets/img/                fotografia em 3 tamanhos
favicon.svg, apple-touch-icon.png, og-image.png
netlify.toml, vercel.json  cabeçalhos de segurança e cache
robots.txt
```

## Pré-visualizar no computador

Abre `index.html` no navegador, ou dentro da pasta corre `python3 -m http.server 8000` e visita http://localhost:8000.

## Publicar (todos têm plano gratuito)

**GitHub Pages**
1. Cria um repositório e envia todos os ficheiros desta pasta (o `index.html` tem de ficar na raiz).
2. Em *Settings → Pages*, escolhe *Deploy from a branch*, ramo `main`, pasta `/ (root)`.
3. O endereço fica `https://o-teu-utilizador.github.io/nome-do-repositorio/`. Os caminhos do site são relativos, por isso funciona nesse subcaminho. O `404.html` usa caminhos absolutos (`/`), por isso só aparece corretamente com domínio próprio ou num repositório chamado `o-teu-utilizador.github.io`.

**Netlify**
1. Em netlify.com, *Add new site → Deploy manually* e arrasta a pasta, ou liga o repositório do GitHub.
2. Sem comando de build; a pasta de publicação é a raiz (já definido em `netlify.toml`).

**Vercel**
1. Em vercel.com, *Add New → Project* e importa o repositório (ou usa `vercel` na pasta).
2. *Framework Preset*: Other. Sem build command e sem output directory.

## Atualizar conteúdo

- **Textos, serviços, projetos, processo:** `assets/js/translations.js`. Cada chave tem versão `pt` e `en`.
- **Contactos:** `assets/js/config.js` (email, WhatsApp). O email e o número também aparecem em texto no `index.html` (contacto e rodapé); se mudares, pesquisa e atualiza lá também.
- **Redes sociais:** em `config.js`, dentro de `socials`, acrescenta só perfis confirmados:
  `{ label: "Instagram", url: "https://www.instagram.com/o_teu_perfil" }`
  Aparecem automaticamente no contacto e no rodapé. Sem perfis, nada é mostrado.
- **Fotografia:** substitui os três ficheiros em `assets/img/` (520, 780 e 994 px de largura, formato WebP, de preferência com fundo transparente), mantendo os nomes.
- **Imagens dos projetos:** os três conceitos são desenhados em HTML/CSS dentro de `index.html` (blocos `.vis`). Se quiseres usar imagens reais, coloca-as em `assets/img/` e troca o bloco `.mock` por uma `<img>` com `alt`.

## Ligar um formulário real

Por defeito, o formulário abre o teu email ou o WhatsApp com a mensagem pronta e diz isso com clareza (não simula envio).
Para receber pedidos diretamente:
1. Cria um formulário num serviço como Formspree ou Netlify Forms e copia o URL de envio.
2. Cola-o em `formEndpoint` no `config.js`.
3. Em `netlify.toml` e/ou `vercel.json`, acrescenta o domínio do serviço a `connect-src` na política `Content-Security-Policy`, senão o navegador bloqueia o pedido.
4. Testa o envio. A mensagem de sucesso só aparece quando o serviço responde com sucesso (o código já trata isso).

## Domínio próprio (mais tarde)

1. Compra o domínio e associa-o no painel do serviço (Netlify, Vercel ou GitHub Pages). O domínio e o alojamento têm custos próprios.
2. No `index.html`, descomenta o bloco de `canonical`, `og:url` e `og:image` e troca `O-TEU-DOMINIO` pelo endereço real. Isto faz a pré-visualização ao partilhar o link mostrar a imagem `og-image.png`.
3. Cria `sitemap.xml` com o URL real e acrescenta a linha `Sitemap:` ao `robots.txt`.

## Lista antes de divulgar

- Abrir o site no telemóvel e no computador, nos dois idiomas.
- Clicar no email e no WhatsApp e confirmar que abrem com a mensagem.
- Confirmar que os três projetos continuam marcados como conceito demonstrativo.
- Confirmar que não há redes sociais ou domínio que ainda não existam.
