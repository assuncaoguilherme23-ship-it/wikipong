/** Formatação de exibição (camada de UI — os módulos puros devolvem números). */
export const brl = (v: number): string =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
