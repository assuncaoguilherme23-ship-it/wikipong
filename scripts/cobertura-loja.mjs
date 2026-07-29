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
  tibhar: {
    loja: 'Tibhar Brasil',
    /* Loja oficial da marca no Brasil. Enumerada pelo sitemap — ver porSitemap(). */
    sitemap: 'https://www.tibhar.com.br/sitemap.xml',
    url: () => 'https://www.tibhar.com.br/borrachas/lisas/',
    tipo: (slug) => {
      /* A própria loja separa lisas de pinos; o slug carrega a distinção. */
      if (/grass|pino-longo|pinos-longos|pino-curto|pinos-curtos|anti/.test(slug)) return null;
      if (slug.startsWith('borracha-')) return 'Borracha';
      if (/^(madeira|raquete)-/.test(slug) && !/montada|kit/.test(slug)) return 'Lâmina';
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

/**
 * Enumera produtos pelo sitemap.xml em vez da listagem de categoria.
 *
 * A loja da Tibhar é Nuvemshop: a página de categoria monta a lista por JS e o
 * HTML servido traz só os 12 primeiros, sem link de "próxima". Ler aquilo daria
 * 12 produtos e a impressão de catálogo completo — o mesmo engano de sempre, com
 * outra roupa. O sitemap lista todas as URLs de produto, que é o que interessa.
 */
async function porSitemap(fonte) {
  const res = await fetch(fonte.sitemap, { headers: { 'user-agent': 'Mozilla/5.0 WikiPong' } });
  if (!res.ok) return [];
  const xml = await res.text();
  const achados = new Map();
  for (const m of xml.matchAll(/<loc>([^<]*\/produtos\/[^<]*)<\/loc>/g)) {
    const url = m[1].trim();
    /* O sitemap lista cada produto DUAS vezes: a URL canônica e uma variante de
       idioma (/pt/produtos/...). A variante devolve a página sem o bloco de
       preço, e como as duas compartilham o slug, a segunda sobrescrevia a
       primeira e a loja inteira aparecia esgotada. Fica só a canônica. */
    if (/\/(pt|es|en)\/produtos\//.test(url)) continue;
    const slug = url.replace(/\/$/, '').split('/produtos/')[1];
    /* O sitemap traz também a URL da própria seção /produtos/, sem slug. */
    if (!slug) continue;
    const tipo = fonte.tipo(slug);
    if (!tipo) continue;
    /* O sitemap não traz título — o nome sai do próprio slug, que nesta loja é
       descritivo ("borracha-tibhar-evolution-mx-p-21mm-preta-..."). */
    achados.set(slug, { nome: slug.replace(/-/g, ' '), tipo, url });
  }
  return [...achados.values()];
}

async function paginas(fonte, marca) {
  if (fonte.sitemap) return porSitemap(fonte);
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
      if (!achados.has(m[1])) achados.set(m[1], { nome, tipo, url: new URL(m[0].match(/href="([^"]+)"/)[1], fonte.url(1)).href });
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
  /* ".0" decimal é ruído de grafia, não modelo: a loja escreve "X 50.0" e o
     catálogo "X50" — mesma borracha. Some ANTES de normalizar, porque
     normalizar() troca o ponto por espaço e o zero viraria dígito solto.
     O "+" vira a palavra "plus" pelo motivo oposto: normalizar() descartaria o
     sinal e "Vega China" e "Vega China +" — que são DUAS borrachas — colidiriam
     na mesma chave, e a segunda esconderia a primeira do relatório. */
  normalizar(s.replace(/(\d)[.,]0(?!\d)/g, '$1').replace(/\+/g, ' plus '))
    .replace(/^.*?\b(xiom|butterfly|tibhar)\b\s*/i, '')
    /* Cor e espessura são opções de compra, não materiais diferentes: a Tibhar
       publica uma página por cor ("... 2.1mm preta" e "... 2.1mm vermelha") da
       mesma borracha. Sem tirar isso, cada borracha contaria em dobro. */
    .replace(/\b(preta|preto|vermelha|vermelho|rosa)\b/g, ' ')
    .replace(/\b\d+[.,]?\d*\s*mm\b/g, ' ')
    .replace(/\b(para )?tenis de mesa\b/g, ' ')
    .replace(/\s*-?\s*(hugo edition|edicao hugo|lancamento|novo|nova)\s*$/i, '')
    .replace(/\s+/g, '');

const casa = (nomeLoja, nomeCatalogo) => chave(nomeLoja) === chave(nomeCatalogo);

/**
 * A página do produto publica preço, ou só um "avise-me"?
 *
 * Cuidado com o rodapé: essas páginas listam "produtos relacionados" COM preço
 * logo abaixo de um produto esgotado SEM preço. Procurar "R$" na página inteira
 * devolve o preço do vizinho — foi assim que o Tenergy 80 FX (esgotado) apareceu
 * custando R$ 537, que é o preço do Tenergy 05. Por isso corta antes.
 */
async function temPreco(url) {
  /* Três respostas, não duas. Um catch que devolvesse "false" transformaria
     "não consegui ler" em "não tem preço" — e foi o que aconteceu: 57 produtos
     da Tibhar caíram de uma vez porque as conexões seguidas ao mesmo host
     falharam, e o relatório deu a loja inteira como esgotada. Erro de leitura
     precisa aparecer como erro. */
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 WikiPong' } });
      if (res.status === 404) return 'nao';
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const principal = html.split(/relacionad|similar|voc[eê] tamb[eé]m|quem viu|quem comprou/i)[0];
      return /R\$\s*[\d.]+,\d{2}/.test(principal) ? 'sim' : 'nao';
    } catch {
      /* Espera crescente antes de tentar de novo; a loja pode estar limitando. */
      await new Promise((r) => setTimeout(r, 400 * tentativa));
    }
  }
  return 'erro';
}

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
  const candidatos = faltando.filter((p) => !ADIADOS.test(p.nome));
  const adiados = faltando.filter((p) => ADIADOS.test(p.nome));

  /* Estar LISTADO não é estar à venda. Estas lojas mantêm a página no ar depois
     de acabar o estoque, sem preço e com "avise-me". Sem preço praticado no
     Brasil não há oferta (D-13) e o material não entra — foi o que aconteceu com
     a Sriver e a Sriver EL. Sem esta segunda passada o relatório acusa lacuna
     que não existe, e a saída fácil para "fechar" viraria inventar preço. */
  const lacuna = [];
  const semPreco = [];
  const ilegiveis = [];
  const caixa = { sim: lacuna, nao: semPreco, erro: ilegiveis };
  for (const p of candidatos) caixa[await temPreco(p.url)].push(p);

  const conta = (lista, t) => lista.filter((x) => x.tipo === t).length;
  console.log(`\n═══ ${marca.toUpperCase()} · ${fonte.loja}`);
  console.log(
    `  loja:     ${conta(daLoja, 'Borracha')} borrachas + ${conta(daLoja, 'Lâmina')} lâminas = ${daLoja.length}`,
  );
  console.log(
    `  WikiPong: ${conta(catalogo, 'Borracha')} borrachas + ${conta(catalogo, 'Lâmina')} lâminas = ${catalogo.length}`,
  );

  if (lacuna.length === 0) {
    console.log(`  ✔ sem lacuna — tudo que a loja VENDE está catalogado`);
  } else {
    console.log(`\n  ✘ LACUNA REAL (à venda, com preço): ${lacuna.length}`);
    for (const p of lacuna) console.log(`      [${p.tipo.padEnd(8)}] ${p.nome}`);
  }
  if (semPreco.length > 0) {
    console.log(`\n  · listados SEM preço (esgotados) — fora do catálogo por D-13: ${semPreco.length}`);
    for (const p of semPreco) console.log(`      [${p.tipo.padEnd(8)}] ${p.nome}`);
  }
  if (adiados.length > 0) {
    console.log(`\n  · adiados de propósito (pinos/anti-spin): ${adiados.length}`);
  }
  if (ilegiveis.length > 0) {
    console.log(`\n  ✘ NÃO CONSEGUI LER ${ilegiveis.length} páginas (3 tentativas cada).`);
    console.log(`     Estes NÃO são "sem preço" — são desconhecidos. Rode de novo.`);
    for (const p of ilegiveis) console.log(`      [${p.tipo.padEnd(8)}] ${p.nome}`);
  }
  return lacuna.length + ilegiveis.length;
}

const alvo = process.argv[2] ? [process.argv[2].toLowerCase()] : Object.keys(FONTES);
let total = 0;
for (const marca of alvo) total += await conferir(marca);
console.log(`\n${total === 0 ? '✔ nenhuma lacuna' : `✘ ${total} materiais fora do catálogo`}\n`);
process.exit(total === 0 ? 0 : 1);
