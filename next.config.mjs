/**
 * WikiPong · configuração do Next.js
 * ------------------------------------------------------------------------------
 * D-17 (ativa): Next.js com EXPORT ESTÁTICO. `output: 'export'` faz o `next build`
 * emitir HTML pré-renderizado por rota em `out/` — SSG desde o dia 1 (o motivo de
 * termos escolhido Next sobre o SPA puro: uma enciclopédia vive de ser achada).
 * Deploy é o conteúdo de `out/` em qualquer host estático (Cloudflare Pages/Vercel),
 * mantendo o "zero ops" que o D-17 pedia.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  // Export estático não roda o otimizador de imagens em runtime.
  images: { unoptimized: true },
  // URLs como pastas (/quiz/ -> /quiz/index.html): amigável a hosts estáticos.
  trailingSlash: true,
};

export default nextConfig;
