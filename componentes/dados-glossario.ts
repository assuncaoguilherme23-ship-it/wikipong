/**
 * Ponte do glossário. O corpus veio da Page 1 antiga do Figma em 2026-07-09 e é
 * também o primeiro corpus do assistente futuro (D-10).
 */
import dados from '@/dados/glossario.json';
import type { TermoDoGlossario } from '@/src/logica/glossario';

export const TERMOS_GLOSSARIO: TermoDoGlossario[] = dados.verbetes as TermoDoGlossario[];

export const AVISO_GLOSSARIO: string = dados.aviso;

/** Slug de âncora para linkar direto ao verbete em /glossario. */
export const ancoraDoTermo = (termo: string): string =>
  termo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
