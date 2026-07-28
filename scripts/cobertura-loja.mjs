/**
 * WikiPong · Cobertura do catálogo contra a listagem da loja
 * ---------------------------------------------------------------------------
 * Responde a UMA pergunta que não dá para responder de memória: dos materiais
 * que a loja brasileira vende, quais ainda não estão no WikiPong?
 *
 * Existe porque a resposta de memória já saiu errada duas vezes. As listagens
 * dessas lojas são PAGINADAS, e ler a página 1 (ou perguntar a um buscador por
 * seis produtos específicos e receber exatamente esses seis) parece um catálogo
 * completo. Não é. Este script varre TODAS as páginas até parar de aparecer
 * produto novo, e compara com dados/materiais.json.
 *
 * Uso:  node scripts/cobertura-loja.mjs [marca]
 *       node scripts/cobertura-loja.mjs xiom
 *       node scripts/cobertura-loja.mjs            (todas as marcas mapeadas)
 *
 * NÃO roda nos testes: depende de rede e o resultado muda quando a loja muda.
 * É ferramenta de colheita, não invariante.
 */
import { readFileSync } from 'node:fs';

/** Onde cada marca é vendida no Brasil, e como ler a listagem. */
const FONTES = {
  xiom: {
    loja: 'OperaTT',
    url: (p) => `https://www.operatt.com.br/marca/xiom.html?pagina=${p}`,
    /** slug do produto → tipo, ou null se não for material (roupa, cola, raqueteira…) */
    marcaNoTitulo: true,
    tipo: (slug) => {
      if (slug.startsWith('borracha-xiom')) return 'Borracha';
      if (/^(madeira|raquete-cl)/.test(slug) && !slug.includes('montada')) return 'Lâmina';
      return null;
    },
  },
  butterfly: {
    loja: 'JJ Yamada',
    url: (p) => `https://loja.jjyamada.com.br/categoria/23241058.html?pagina=${p}`,
    /* Distribuidora exclusiva da Butterfly: o título do produto é só o modelo. */
    marcaNoTitulo: false,
    /* Aceita QUALQUER slug de borracha e exclui só o link da categoria, pelo
       nome. A tentação é exigir um padrão mais estreito ("...-modelo-...") —
       mas os produtos não seguem um padrão único, e um leitor estreito descarta
       produto de verdade em silêncio. Filtro largo, exceção nominal. */
    tipo: (slug) =>
      slug.startsWith('borracha-') && !/^borracha-para-raquete-tenis-de-mesa-?$/.test(slug)
        ? 'Borracha'
        : null,
  },
};

const MAX_PAGINAS = 12;

/** Pinos e anti-spin foram adiados de propósito pelo fundador — não são lacuna. */
const ADIADOS = /feint|impartial|ilius|speedy|orthodox|challenger|super\s*anti|bugller|chop|\bp\.?o\.?\b|\bl\.?p\.?\b|long|\bo\.?x\.?\b/i;

const normalizar = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

async function paginas(fonte, marca) {
  const achados = new Map();
  let anterior = -1;
  for (let p = 1; p <= MAX_PAGINAS; p++) {
    const res = await fetch(fonte.url(p), { headers: { 'user-agent': 'Mozilla/5.0 WikiPong' } });
    if (!res.ok) break;
    const html = await res.text();
    const re = /<a[^>]+href="https?:\/\/[^"/]+\/([^"?#]+?)"[^>]*title="([^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const tipo = fonte.tipo(m[1]);
      if (!tipo) continue;
      const nome = decodeHtml(m[2]).trim();
      /* Cada card tem VÁRIOS links para o mesmo produto (foto, nome, "Ver
         detalhes"). Só o do nome serve; os genéricos sobrescreveriam o título
         real e o relatório viraria uma lista de "Ver detalhes do produto". */
      if (/^(ver detalhes|comprar|adicionar|saiba mais|leia mais)/i.test(nome)) continue;
      /* Link de categoria ("Raquetes", "Borrachas") não é produto. Em loja
         multimarca o produto sempre traz a marca no título; em distribuidora de
         marca única, não traz — lá quem filtra é o slug. */
      if (fonte.marcaNoTitulo && !new RegExp(`\\b${marca}\\b`, 'i').test(nome)) continue;
      if (!achados.has(m[1])) achados.set(m[1], { nome, tipo });
    }
    /* Página que não trouxe nada novo = fim da listagem. Sem isso o laço leria
       a última página repetidamente e daria falsa sensação de completude. */
    if (achados.size === anterior) break;
    anterior = achados.size;
  }
  return [...achados.values()];
}

const decodeHtml = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

/**
 * Chave de comparação de modelo.
 *
 * A loja escreve "Borracha Para Raquete de Tênis de Mesa XIOM - Jekyll & Hyde
 * C 55.0" e o catálogo escreve "Xiom Jekyll & Hyde C55.0". Três diferenças
 * atrapalham: o palavrório da loja antes da marca, o espaço em "C 55.0" e os
 * sufixos comerciais ("- Hugo Edition"). Tirando os três sobra "jekyllhydec550"
 * dos dois lados.
 *
 * A comparação final é por IGUALDADE, não por "contém": "vegapro" está contido
 * em "vegaprohybrid", e um comparador por substring daria a Vega Pro Hybrid como
 * já catalogada quando ela é outro produto.
 */
const chave = (s) =>
  normalizar(s)
    .replace(/^.*?\b(xiom|butterfly)\b\s*/i, '')
    .replace(/\s*-?\s*(hugo edition|edicao hugo|lancamento|novo|nova)\s*$/i, '')
    .replace(/\s+/g, '');

const casa = (nomeLoja, nomeCatalogo) => chave(nomeLoja) === chave(nomeCatalogo);

async function conferir(marca) {
  const fonte = FONTES[marca];
  if (!fonte) throw new Error(`marca sem fonte mapeada: ${marca}`);

  const daLoja = await paginas(fonte, marca);

  /* Ler ZERO produto não é "loja sem lacuna" — é leitor quebrado (loja fora do
     ar, layout mudou, seletor errado). Silenciar isso reproduziria exatamente o
     erro que este script existe para evitar: confundir "não encontrei" com
     "não existe". Falha alto em vez de dar um ✔ falso. */
  if (daLoja.length === 0) {
    console.log(`\n═══ ${marca.toUpperCase()} · ${fonte.loja}`);
    console.log(`  ✘ LEITURA FALHOU: nenhum produto reconhecido na listagem.`);
    console.log(`     Isto NÃO significa catálogo completo. Confira ${fonte.url(1)}`);
    return Number.POSITIVE_INFINITY;
  }

  const catalogo = JSON.parse(readFileSync('dados/materiais.json', 'utf8')).materiais.filter(
    (m) => normalizar(m.marca) === marca,
  );

  const faltando = daLoja.filter((p) => !catalogo.some((m) => casa(p.nome, m.nome)));
  const lacuna = faltando.filter((p) => !ADIADOS.test(p.nome));
  const adiados = faltando.filter((p) => ADIADOS.test(p.nome));

  const conta = (lista, t) => lista.filter((x) => x.tipo === t).length;
  console.log(`\n═══ ${marca.toUpperCase()} · ${fonte.loja}`);
  console.log(
    `  loja:     ${conta(daLoja, 'Borracha')} borrachas + ${conta(daLoja, 'Lâmina')} lâminas = ${daLoja.length}`,
  );
  console.log(
    `  WikiPong: ${conta(catalogo, 'Borracha')} borrachas + ${conta(catalogo, 'Lâmina')} lâminas = ${catalogo.length}`,
  );

  if (lacuna.length === 0) {
    console.log(`  ✔ sem lacuna — tudo que a loja vende está catalogado`);
  } else {
    console.log(`\n  ✘ LACUNA REAL: ${lacuna.length}`);
    for (const p of lacuna) console.log(`      [${p.tipo.padEnd(8)}] ${p.nome}`);
  }
  if (adiados.length > 0) {
    console.log(`\n  · adiados de propósito (pinos/anti-spin): ${adiados.length}`);
  }
  return lacuna.length;
}

const alvo = process.argv[2] ? [process.argv[2].toLowerCase()] : Object.keys(FONTES);
let total = 0;
for (const marca of alvo) total += await conferir(marca);
console.log(`\n${total === 0 ? '✔ nenhuma lacuna' : `✘ ${total} materiais fora do catálogo`}\n`);
process.exit(total === 0 ? 0 : 1);
