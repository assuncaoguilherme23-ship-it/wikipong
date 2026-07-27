/**
 * Endereço público do site, em um lugar só.
 *
 * A Vercel injeta VERCEL_PROJECT_PRODUCTION_URL no build e ela já reflete o
 * domínio de PRODUÇÃO — inclusive um domínio próprio, quando houver. Então
 * trocar de domínio não exige tocar em código: o sitemap, o robots e as
 * canônicas passam a apontar pro novo endereço sozinhos.
 *
 * Local cai no dev server. Sem domínio chutado em lugar nenhum.
 */
export const URL_SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

/** Junta a base com um caminho, respeitando o trailingSlash do next.config. */
export function url(caminho: string): string {
  const limpo = caminho.startsWith('/') ? caminho : `/${caminho}`;
  const comBarra = limpo.endsWith('/') ? limpo : `${limpo}/`;
  return `${URL_SITE}${comBarra === '//' ? '/' : comBarra}`;
}
