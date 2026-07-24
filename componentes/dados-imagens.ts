/**
 * Ponte tipada para dados/imagens.json — imagens oficiais de produto.
 *
 * Cada imagem é a OFICIAL do fabricante, com crédito e URL de origem (D-16).
 * Sem imagem aprovada → `undefined`, e a UI cai no Glifo tipográfico (fallback).
 * Os arquivos vivem em public/produtos/ e são servidos em /produtos/<arquivo>.
 */
import dados from '@/dados/imagens.json';

export interface ImagemProduto {
  /** Nome do arquivo em public/produtos/. */
  arquivo: string;
  /** Fabricante creditado (ex.: "Butterfly"). */
  fonte: string;
  /** Página oficial de onde a imagem veio. */
  fonteUrl: string;
  /** Data da checagem (ISO). */
  consultadoEm: string;
}

const IMAGENS = dados.imagens as Record<string, ImagemProduto>;

export const AVISO_IMAGENS: string = dados.aviso;

/** Imagem oficial de um material, ou undefined (aí a UI usa o Glifo). */
export function imagemDoMaterial(id: string): ImagemProduto | undefined {
  return IMAGENS[id];
}

/** Caminho público servido no export estático. */
export function caminhoImagem(img: ImagemProduto): string {
  return `/produtos/${img.arquivo}`;
}
