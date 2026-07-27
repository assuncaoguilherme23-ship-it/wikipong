/**
 * WikiPong · robots.txt (gerado no build).
 *
 * Postura: o site QUER ser indexado — é uma enciclopédia, distribuição é busca
 * (D-17). Então libera tudo, com duas exceções que não são conteúdo:
 *
 *  · `/ir/`  — interstitial de saída pra loja (já `noindex`). Indexar redirect
 *              não serve a ninguém e ainda diluiria a autoridade das fichas.
 *  · `/_next/` — bundles e assets internos do framework.
 */
import type { MetadataRoute } from 'next';
import { url, URL_SITE } from '@/componentes/site';

/** Export estático (D-17) exige que rotas de metadata sejam geradas no build. */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/ir/', '/_next/'],
    },
    sitemap: `${URL_SITE}/sitemap.xml`,
    host: url('/').replace(/\/$/, ''),
  };
}
