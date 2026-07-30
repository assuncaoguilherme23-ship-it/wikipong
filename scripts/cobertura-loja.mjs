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
 *
 * ONDE MORA O PREÇO, LOJA A LOJA — anotado depois de eu publicar 25 borrachas
 * Stiga a R$ 399 quando nenhuma custava isso:
 *
 *   AmericaTT (WooCommerce)  → schema.org ("price"). O primeiro "R$ ..." do
 *                              HTML é um BANNER da loja, não o preço, e vem
 *                              antes do bloco do produto. Ler o texto visível
 *                              dá o mesmo número em toda página do site.
 *   Tibhar Brasil            → schema.org e texto visível concordam.
 *   Tray / Loja Integrada    → primeiro "R$ ..." é o preço; os seguintes são
 *   (OperaTT, TMS, JJ Yamada)  parcela e Pix. Sem schema.org.
 *
 * O sintoma que denuncia: vários produtos de linhas diferentes com preço
 * idêntico ao centavo. Confira sempre contra um preço que você já tem de outra
 * fonte — invariante interno não pega leitor errado, porque catálogo e oferta
 * saem do mesmo leitor.
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
    /* A loja omite o nome da família ("MX-P 50°" para o oficial "Evolution
       MX-P 50°"). Só estas palavras podem faltar — ver casa(). */
    familia: ['evolution', 'hybrid'],
    url: () => 'https://www.tibhar.com.br/borrachas/lisas/',
    tipo: (slug) => {
      /* A própria loja separa lisas de pinos; o slug carrega a distinção. */
      /* d-tecs cobre Grass, Verde, Speedy e Vari Spin D.Tecs — todas de pinos. */
      if (/grass|d-tecs|pino-longo|pinos-longos|pino-curto|pinos-curtos|anti/.test(slug)) return null;
      if (slug.startsWith('borracha-')) return 'Borracha';
      if (/^(madeira|raquete)-/.test(slug) && !/montada|kit/.test(slug)) return 'Lâmina';
      return null;
    },
  },
  yasaka: {
    loja: 'Tênis de Mesa Store',
    url: (p) => `https://www.tenisdemesastore.com.br/marca/yasaka.html?pagina=${p}`,
    marcaNoTitulo: true,
    /* A loja mantém no nome a linha anterior do produto: "MYTH Extra Offensive
       (Nova Ma Lin)". A MYTH sucedeu a linha Ma Lin — é a mesma lâmina. */
    familia: ['nova', 'ma', 'lin'],
    tipo: (slug) => {
      /* A loja marca no próprio slug o que é anti-spin e pinos — adiados. */
      if (/anti-spin|anti-power|pino|long/.test(slug)) return null;
      if (slug.startsWith('borracha-yasaka')) return 'Borracha';
      if (/^raquete-(classica|classineta)-yasaka/.test(slug)) return 'Lâmina';
      return null;
    },
  },
  dhs: {
    loja: 'Tênis de Mesa Store + OperaTT',
    /* Duas lojas: os catálogos DHS delas quase não se sobrepõem — ver paginas(). */
    leitores: [
      {
        loja: 'Tênis de Mesa Store',
        url: (p) => `https://www.tenisdemesastore.com.br/marca/dhs.html?pagina=${p}`,
        marcaNoTitulo: true,
        tipo: (slug) => {
          if (/pino|anti|raqueteira|case/.test(slug)) return null;
          if (slug.startsWith('borracha-dhs')) return 'Borracha';
          /* A DHS numerada (1002, 2002, 3002, 1006…) é raquete MONTADA, com
             borracha colada — a OperaTT chama assim, a Tênis de Mesa Store
             chama de "Raquete Clássica". Não é lâmina avulsa, e a colheita de
             marca é de borracha e lâmina. */
          if (/-\d{4}\b/.test(slug)) return null;
          if (/^raquete-(classica|classineta)/.test(slug)) return 'Lâmina';
          return null;
        },
      },
      {
        loja: 'OperaTT',
        url: (p) => `https://www.operatt.com.br/marca/dhs.html?pagina=${p}`,
        marcaNoTitulo: true,
        tipo: (slug) => {
          if (/pino|anti|montada|raqueteira/.test(slug)) return null;
          if (slug.startsWith('borracha-')) return 'Borracha';
          if (/^madeira-/.test(slug)) return 'Lâmina';
          return null;
        },
      },
    ],
  },
  donic: {
    loja: 'AmericaTT',
    url: (p) => `https://americatt.net/marca/donic/${p > 1 ? `page/${p}/` : ''}`,
    marcaNoTitulo: true,
    /* Mesma loja e mesmo padrao da Stiga: slug sem prefixo fixo. A lista de
       linhas de BORRACHA da Donic e' outra — ver comentario em stiga.tipo(). */
    tipo: (slug) => {
      if (!/donic/.test(slug)) return null;
      if (/raqueteira|capa|bola|cola|rede|mesa-de-|kit|^pino-|-pino-/.test(slug)) return null;
      /* PINOS da Donic, conferidos no indice /pips/ do Revspin — que separa por
         URL: /rubber/ para lisa, /pips/ para pinos. Eu tinha desconfiado de
         Desto, Vario e Baracuda; nenhuma das tres esta la'. Sao lisas. Das que
         eu suspeitei, so' a Piranja e' de pinos mesmo. */
      if (/akkadi|baxster|baxter|twister|alligator|piranja|spike|zicco/.test(slug)) return null;
      if (slug.startsWith('borracha-')) return 'Borracha';
      if (slug.startsWith('madeira-')) return 'Lâmina';
      if (slug.startsWith('raquete-')) return null;
      const LINHAS_DE_BORRACHA =
        /bluestorm|bluefire|bluestar|baracuda|acuda|coppa|desto|vario|slice|sonex|traction/;
      return LINHAS_DE_BORRACHA.test(slug) ? 'Borracha' : 'Lâmina';
    },
  },
  stiga: {
    loja: 'AmericaTT',
    /* O slug "stiga-cybershape" redireciona para a Cybershape Carbon: e' apelido
       da mesma pagina, e a palavra que falta no nome curto e' a familia. */
    familia: ['carbon'],
    url: (p) => `https://americatt.net/marca/stiga/${p > 1 ? `page/${p}/` : ''}`,
    marcaNoTitulo: true,
    /**
     * Esta loja é WooCommerce e o slug do produto NÃO segue prefixo fixo: há
     * "borracha-stiga-dna-dragon-grip" e "madeira-stiga-clipper", mas também
     * "stiga-calibra-lt" (borracha) e "stiga-carbonado-145" (lâmina) sem
     * prefixo nenhum. Para os slugs nus a classificação é por NOME DE LINHA
     * conhecida — heurística de exibição, para a contagem do relatório sair
     * legível. O que importa (a lista de lacuna) não depende dela: o tipo real
     * de cada material é decidido na colheita, lendo a página do produto.
     */
    tipo: (slug) => {
      if (!/stiga/.test(slug)) return null;
      /* "pino-stiga-symmetry" é de pinos — adiado, como nas outras marcas. */
      if (/raqueteira|capa|bola|cola|rede|mesa-de-|kit|^pino-|-pino-/.test(slug)) return null;
      if (slug.startsWith('borracha-')) return 'Borracha';
      if (slug.startsWith('madeira-')) return 'Lâmina';
      /* "raquete-stiga-*" é raquete montada, com borracha colada. */
      if (slug.startsWith('raquete-')) return null;
      /* "helix" entrou depois: as oito Helix (Hybrid e Platinum, em H/M/XH/55)
         caíram como lâmina na primeira passada e por isso ficaram FORA do lote
         de borrachas. Dois sinais as delatam: custam R$ 399, o mesmo preço das
         17 borrachas Stiga confirmadas, enquanto lâmina da marca nesta loja vai
         de R$ 400 a mais de mil; e o sufixo H/M/XH/55 é o mesmo das linhas DNA
         Hybrid e DNA Platinum, que são borracha. */
      const LINHAS_DE_BORRACHA =
        /dna|helix|calibra|mantra|genesis|boost|airoc|magna|symbol|almana|innova|royal|neos/;
      return LINHAS_DE_BORRACHA.test(slug) ? 'Borracha' : 'Lâmina';
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

/**
 * Uma marca pode estar espalhada por mais de uma loja.
 *
 * A DHS é o caso: a Tênis de Mesa Store tem a linha Hurricane e as lâminas
 * 2002/PG7/PG8; a OperaTT tem as Sirocco, as W1030/W1130 e a G555. Nenhuma das
 * duas sozinha é o catálogo da marca no Brasil — ancorar numa só faria o
 * relatório dizer "sem lacuna" com metade dos produtos de fora, que é o erro
 * que este script existe para não deixar acontecer.
 */
async function paginas(fonte, marca) {
  if (fonte.leitores) {
    const todos = [];
    for (const leitor of fonte.leitores) {
      todos.push(...(await paginas({ ...leitor, familia: fonte.familia }, marca)));
    }
    return todos;
  }
  if (fonte.sitemap) return porSitemap(fonte);
  const achados = new Map();
  let anterior = -1;
  for (let p = 1; p <= MAX_PAGINAS; p++) {
    const res = await fetch(fonte.url(p), { headers: { 'user-agent': 'Mozilla/5.0 WikiPong' } });
    if (!res.ok) break;
    const html = await res.text();
    /* O `title=` é opcional: as lojas Tray/Loja Integrada põem, a AmericaTT
       (WooCommerce) não. Sem ele o nome sai do slug, como no sitemap — exigir
       title fazia o leitor devolver ZERO produto numa loja com 48 por página. */
    const re = /<a[^>]+href="https?:\/\/[^"/]+\/([^"?#]+?)"(?:[^>]*title="([^"]+)")?/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const tipo = fonte.tipo(m[1]);
      if (!tipo) continue;
      const nome = m[2] ? decodeHtml(m[2]).trim() : m[1].replace(/\/$/, '').replace(/-/g, ' ');
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
    /* Corta o palavrório da loja ATÉ a marca ("Borracha Para Raquete de Tênis
       de Mesa XIOM - ...") e, só depois, remove eventuais repetições da marca:
       a OperaTT escreve "... DHS - DHS G555", com ela duas vezes. Trocar o
       primeiro corte pelo global deixava "borracha para" sobrando no nome e
       derrubava as cinco marcas de uma vez. */
    .replace(/^.*?\b(xiom|butterfly|tibhar|yasaka|dhs|stiga|donic)\b\s*/i, '')
    .replace(/\b(xiom|butterfly|tibhar|yasaka|dhs|stiga|donic)\b/gi, ' ')
    /* Cor e espessura são opções de compra, não materiais diferentes: a Tibhar
       publica uma página por cor ("... 2.1mm preta" e "... 2.1mm vermelha") da
       mesma borracha. Sem tirar isso, cada borracha contaria em dobro. */
    .replace(/\b(preta|preto|vermelha|vermelho|rosa|roxa|roxo|azul|verde|violeta)\b/g, ' ')
    .replace(/\b\d+[.,]?\d*\s*mm\b/g, ' ')
    /* "max" é espessura, não modelo: a loja vende "HYBRID K3 Max" e o catálogo
       registra "Hybrid K3". E o "de" que sobra vem do slug ("...-de-mesa-de"),
       depois de tirar o "para tênis de mesa". */
    .replace(/\bmax\b/g, ' ')
    /* "classineta" é formato de cabeça e "cópia" é artefato de cadastro da loja:
       a mesma lâmina aparece como clássica, classineta e cópia. O formato se
       escolhe na compra, como o cabo — é um material só. */
    /* "copia" NÃO entra aqui: quem trata dela é a regra do par "copia <token>"
       mais abaixo. Removê-la sozinha deixaria o sufixo órfão ("dzumb") no nome. */
    .replace(/\b(classinetas|classineta|classica|com cabo fl|cabo fl|cabo concavo)\b/g, ' ')
    .replace(/\b(com )?(\d+) folhas\b/g, ' ')
    .replace(/\braquete\b/g, ' ')
    /* A loja descreve a lâmina dentro do nome ("... com Carbono", "... e cabo
       FL", "estoque") e o catálogo usa só o modelo. São palavras de descrição,
       não de identidade. "carbono" em português não colide com o "Carbon" que
       faz parte do nome do produto — esse fica. E "copia <token>" é cadastro
       duplicado da loja. */
    .replace(/\bcopia\s+\S+/g, ' ')
    .replace(
      /\b(carbono|estoque|cabo|fl|com|e|do|da|profissional|ittf|pegajosa|pegajoso|tenis|mesa|para|envio|imediato)\b/g,
      ' ',
    )
    /* A AmericaTT cadastrou UMA borracha com o nome traduzido: "DNA Dragão Poder
       52.5" para a Dragon Power 52.5. É a mesma borracha, e o resto da linha está
       em inglês na própria loja. */
    .replace(/\bdragao\b/g, 'dragon')
    .replace(/\bpoder\b/g, 'power')
    /* Dígito solto vem de "5 + 2 carbono" e da contagem de folhas. */
    .replace(/\b\d\b/g, ' ')
    .replace(/\b(para )?tenis de mesa\b/g, ' ')
    .replace(/\bde\b/g, ' ')
    .replace(/\s*-?\s*(hugo edition|edicao hugo|lancamento|novo|nova)\s*$/i, '')
    /* Sufixo aleatório de slug do Nuvemshop, quando dois produtos disputariam a
       mesma URL: "...-super-defense-40-soft-z2fpn". Letra+dígito misturados e no
       fim — não é modelo, é desempate de endereço. */
    /* O `(?![a-z]+\d+$)` é o que separa lixo de modelo: sufixo do Nuvemshop tem
       letra e dígito INTERCALADOS ("z2fpn", "i9t7a"), enquanto código de produto
       é letra seguida de número ("g555"). Sem essa guarda a regra comia o nome
       da própria borracha e a G555 nunca casava. */
    .replace(
      /\s+(?=[a-z0-9]{4,6}$)(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])(?![a-z]+\d+$)[a-z0-9]+$/,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();

/** Palavras da chave, como conjunto — a ordem entre elas não importa. */
const palavras = (s) => new Set(chave(s).split(' ').filter(Boolean));

/**
 * Duas coisas quebram a comparação literal, e as duas aparecem na Tibhar:
 *
 *  · ORDEM. A loja escreve "MK FX Hybrid" e o catálogo "Hybrid MK FX". Mesmo
 *    produto, mesma palavras, ordem trocada. Por isso comparamos CONJUNTOS.
 *  · PALAVRA DE FAMÍLIA OMITIDA. A loja vende "MX-P 50°" e o produto oficial é
 *    "Evolution MX-P 50°". Aceitar qualquer subconjunto resolveria — e criaria
 *    um erro pior: "Vega Pro" viraria "Vega Pro Hybrid" na Xiom, que é OUTRA
 *    borracha. Então a folga é declarada POR LOJA: só as palavras que aquela
 *    marca usa como nome de família podem faltar. Onde nada é declarado, a
 *    comparação continua exata.
 */
function casa(nomeLoja, nomeCatalogo, familia = []) {
  /* Colada primeiro: a Xiom escreve "C 52.5" na loja e "C52.5" no catálogo, e
     por token isso vira {c,52} contra {c52} — mesma borracha, conjuntos
     diferentes. Grudar as palavras faz as duas grafias coincidirem. */
  if (chave(nomeLoja).replace(/\s+/g, '') === chave(nomeCatalogo).replace(/\s+/g, '')) return true;
  const a = palavras(nomeLoja);
  const b = palavras(nomeCatalogo);
  if (a.size === b.size && [...a].every((t) => b.has(t))) return true;
  if (familia.length === 0) return false;
  const [menor, maior] = a.size <= b.size ? [a, b] : [b, a];
  if (![...menor].every((t) => maior.has(t))) return false;
  const sobra = [...maior].filter((t) => !menor.has(t));
  return sobra.length > 0 && sobra.every((t) => familia.includes(t));
}

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

  const faltando = daLoja.filter((p) => !catalogo.some((m) => casa(p.nome, m.nome, fonte.familia)));
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
