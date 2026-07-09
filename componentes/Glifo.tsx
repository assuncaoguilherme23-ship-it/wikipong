/**
 * Glifos SVG por tipo de material (colhidos do protótipo — D-15), normalizando as
 * "imagens" dos cards. Cores mapeadas do accent vermelho do protótipo para os
 * tokens verde-mesa. Decorativos: sempre aria-hidden (o card já tem o tipo em texto).
 */

export function Glifo({ tipo, tamanho = 64 }: { tipo: string; tamanho?: number }) {
  const comum = { width: tamanho, height: tamanho, viewBox: '0 0 72 72', 'aria-hidden': true as const };

  if (tipo === 'Borracha') {
    // quadrado arredondado + textura de pinos
    const pinos = Array.from({ length: 25 }, (_, i) => {
      const linha = Math.floor(i / 5);
      const coluna = i % 5;
      return <circle key={i} cx={17 + coluna * 9.5} cy={17 + linha * 9.5} r={1.7} fill="var(--cor-papel)" opacity={0.5} />;
    });
    return (
      <svg {...comum}>
        <rect x="8" y="8" width="56" height="56" rx="12" fill="var(--cor-tinta)" />
        {pinos}
        <rect x="8" y="8" width="56" height="56" rx="12" fill="none" stroke="var(--cor-acento)" strokeWidth="2" />
      </svg>
    );
  }

  if (tipo === 'Lâmina') {
    return (
      <svg {...comum}>
        <ellipse cx="36" cy="28" rx="20" ry="22" fill="var(--cor-superficie-2)" stroke="var(--cor-tinta)" strokeWidth="2" />
        <rect x="31" y="46" width="10" height="20" rx="3" fill="var(--cor-tinta)" />
        <line x1="36" y1="8" x2="36" y2="48" stroke="var(--cor-acento)" strokeWidth="2" opacity="0.5" />
      </svg>
    );
  }

  if (tipo === 'Raquete') {
    return (
      <svg {...comum}>
        <circle cx="36" cy="28" r="22" fill="var(--cor-acento)" stroke="var(--cor-tinta)" strokeWidth="2" />
        <rect x="31" y="46" width="10" height="20" rx="3" fill="var(--cor-tinta)" />
      </svg>
    );
  }

  // Bola
  return (
    <svg {...comum}>
      <circle cx="36" cy="36" r="24" fill="var(--cor-superficie)" stroke="var(--cor-tinta)" strokeWidth="2" />
      <path d="M20 30 Q36 22 52 30" fill="none" stroke="var(--cor-linha-forte)" strokeWidth="2" />
      <circle cx="36" cy="36" r="24" fill="none" stroke="var(--cor-acento)" strokeWidth="2" strokeDasharray="3 5" opacity="0.6" />
    </svg>
  );
}
