/**
 * WikiPong · sitemap.xml (gerado no build — export estático).
 *
 * Existe porque o D-17 escolheu Next sobre SPA justamente por SEO ("uma
 * enciclopédia vive de ser achada") e o site tinha 40+ rotas estáticas sem
 * nenhum mapa. Fichas, guias e páginas de marca existem para captar busca.
 *
 * `lastModified` é DATA REAL, não a data do build (D-16): cada ficha carrega a
 * checagem mais recente que a alimenta (fabricante, oferta, imagem), e cada
 * notícia carrega a data de publicação. Dizer que tudo mudou hoje, todo dia,
 * seria mentir para o robô — e ensina o robô a ignorar o campo.
 *
 * `/ir` fica de fora de propósito: é interstitial de saída, já noindex.
 */
import type { MetadataRoute } from 'next';
import { url } from '@/componentes/site';
import { MATERIAIS } from '@/componentes/dados-materiais';
import { MARCAS } from '@/componentes/dados-marcas';
import { GUIAS } from './aprender/guias';
import { fabricantePorId } from '@/componentes/dados-fabricante';
import { ofertasDoMaterial } from '@/componentes/dados-ofertas';
import { imagemDoMaterial } from '@/componentes/dados-imagens';
import { NOTICIAS } from '@/componentes/dados-noticias';
import { CONSULTADO_EM_USO } from '@/componentes/dados-uso-atual';
import { CONSULTADO_EM_CALENDARIO } from '@/componentes/dados-competicoes';
import { PROFISSIONAIS } from '@/componentes/dados-profissionais';

/** Export estático (D-17) exige que rotas de metadata sejam geradas no build. */
export const dynamic = 'force-static';

/** Data mais recente de uma lista de ISOs; undefined quando não há nenhuma. */
function maisRecente(...datas: (string | undefined)[]): Date | undefined {
  const validas = datas.filter((d): d is string => Boolean(d)).sort();
  const ultima = validas[validas.length - 1];
  if (!ultima) return undefined;
  const d = new Date(`${ultima}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Quando o conteúdo DESTA ficha mudou pela última vez, de verdade. */
function atualizacaoDoMaterial(id: string): Date | undefined {
  return maisRecente(
    fabricantePorId(id)?.consultadoEm,
    imagemDoMaterial(id)?.consultadoEm,
    ...ofertasDoMaterial(id).map((o) => o.atualizadoEm),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const materiais = MATERIAIS.map((m) => ({
    url: url(`/materiais/${m.id}`),
    lastModified: atualizacaoDoMaterial(m.id),
  }));

  const marcas = MARCAS.map((m) => ({
    url: url(`/marcas/${m.slug}`),
    // A página da marca é derivada das fichas dela: herda a checagem mais nova.
    lastModified: maisRecente(
      ...m.materiais.map((mat) => atualizacaoDoMaterial(mat.id)?.toISOString().slice(0, 10)),
    ),
  }));

  const guias = GUIAS.map((g) => ({ url: url(`/aprender/${g.slug}`) }));

  const noticias = maisRecente(...NOTICIAS.map((n) => n.publicadoEm));
  const profissionais = maisRecente(...PROFISSIONAIS.map((p) => p.consultadoEm));

  const fixas: MetadataRoute.Sitemap = [
    { url: url('/') },
    { url: url('/catalogo') },
    { url: url('/top-borrachas'), lastModified: new Date(CONSULTADO_EM_USO) },
    { url: url('/montar') },
    { url: url('/conjuntos') },
    { url: url('/comparar') },
    { url: url('/quiz') },
    { url: url('/escalas') },
    { url: url('/marcas') },
    { url: url('/aprender') },
    { url: url('/glossario') },
    { url: url('/profissionais'), lastModified: profissionais },
    { url: url('/noticias'), lastModified: noticias },
    { url: url('/competicoes'), lastModified: new Date(CONSULTADO_EM_CALENDARIO) },
  ];

  return [...fixas, ...materiais, ...marcas, ...guias];
}
