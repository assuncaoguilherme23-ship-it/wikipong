/**
 * WikiPong · Bandeira do país, desenhada
 * ------------------------------------------------------------------------------
 * POR QUE NÃO EMOJI. Os dados dos profissionais trazem a bandeira como emoji
 * (🇧🇷, 🇨🇳, 🇯🇵) e a página usava isso direto. Só que o WINDOWS NUNCA
 * EMBARCOU GLIFOS DE BANDEIRA: em vez do desenho, ele mostra as duas letras do
 * código do país numa caixinha — "BR", "CN", "JP". Quem abre o site no Windows,
 * que é a maioria do público brasileiro, vê letras onde deveria ver bandeira.
 *
 * Não é bug do site nem da fonte: é decisão da Microsoft, e não há CSS que
 * resolva. A saída é desenhar.
 *
 * O desenho é SIMPLIFICADO de propósito. Numa altura de 16 a 24 pixels, as 27
 * estrelas da bandeira brasileira viram ruído cinza — o que identifica o país
 * nesse tamanho é a forma e a cor, não o detalhe. A faixa "ORDEM E PROGRESSO"
 * também sai: ilegível é pior que ausente.
 *
 * Para acrescentar um país: uma entrada em BANDEIRAS. O `viewBox` é sempre
 * 3 × 2, a proporção que a maioria das bandeiras usa.
 */

const BANDEIRAS: Readonly<Record<string, React.ReactNode>> = {
  Brasil: (
    <>
      <rect width="30" height="20" fill="#009B3A" />
      <path d="M15 2.2 27.5 10 15 17.8 2.5 10Z" fill="#FEDF00" />
      <circle cx="15" cy="10" r="4.6" fill="#002776" />
      {/* A faixa branca, sem a legenda — que seria ilegível neste tamanho. */}
      <path d="M10.6 8.4a4.6 4.6 0 0 0 8.6 2.6" stroke="#fff" strokeWidth="1.3" fill="none" />
    </>
  ),
  China: (
    <>
      <rect width="30" height="20" fill="#DE2910" />
      <path d="m5.6 3 .93 2.86h3l-2.43 1.77.93 2.86-2.43-1.77-2.43 1.77.93-2.86L1.67 5.86h3Z" fill="#FFDE00" />
      <circle cx="10.8" cy="2.9" r="0.85" fill="#FFDE00" />
      <circle cx="12.6" cy="4.9" r="0.85" fill="#FFDE00" />
      <circle cx="12.6" cy="7.5" r="0.85" fill="#FFDE00" />
      <circle cx="10.8" cy="9.4" r="0.85" fill="#FFDE00" />
    </>
  ),
  Japão: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </>
  ),
  Alemanha: (
    <>
      <rect width="30" height="6.67" fill="#000" />
      <rect y="6.67" width="30" height="6.67" fill="#DD0000" />
      <rect y="13.33" width="30" height="6.67" fill="#FFCE00" />
    </>
  ),
  França: (
    <>
      <rect width="10" height="20" fill="#002395" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </>
  ),
  Suécia: (
    <>
      <rect width="30" height="20" fill="#006AA7" />
      <rect x="8.5" width="3.5" height="20" fill="#FECC00" />
      <rect y="8.25" width="30" height="3.5" fill="#FECC00" />
    </>
  ),
  Coreia_do_Sul: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="4.5" fill="#CD2E3A" />
      <path d="M10.5 10a4.5 4.5 0 0 1 9 0 2.25 2.25 0 0 0-4.5 0 2.25 2.25 0 0 1-4.5 0Z" fill="#0047A0" />
    </>
  ),
};

export function Bandeira({ pais, altura = 20 }: { pais: string; altura?: number }) {
  const desenho = BANDEIRAS[pais.replace(/\s+/g, '_')] ?? BANDEIRAS[pais];

  /* País sem desenho não vira caixa vazia nem emoji quebrado: some, e o nome
     do país (que está ao lado na tela) segue dando a informação. */
  if (!desenho) return null;

  return (
    <svg
      viewBox="0 0 30 20"
      width={altura * 1.5}
      height={altura}
      role="img"
      aria-label={`Bandeira: ${pais}`}
      style={{
        display: 'block',
        borderRadius: 2,
        /* Contorno sutil: sem ele, a bandeira do Japão (branca) desaparece
           contra a superfície clara do cartão. */
        boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 0.12)',
        flexShrink: 0,
      }}
    >
      {desenho}
    </svg>
  );
}
