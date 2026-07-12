/** Formatação de exibição (camada de UI — os módulos puros devolvem números).
 *  `centavos: true` para valores derivados (ex.: custo/mês = R$ 112,50);
 *  o default inteiro serve preços de catálogo. Fonte única — não duplicar. */
export const brl = (v: number, centavos = false): string =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: centavos ? 2 : 0,
  });
