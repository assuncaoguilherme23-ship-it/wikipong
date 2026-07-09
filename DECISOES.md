# DECISOES.md — WikiPong

> **O que é este arquivo:** registro de decisões (estilo ADR — *Architecture Decision Record*) do WikiPong.
> Cada entrada diz **o que** foi decidido, **por quê**, **o que substitui** e o **status**.
>
> **Quem lê:** humanos do projeto e o Claude Code durante a implementação.
>
> ⚠️ **Aviso de divergência:** os protótipos HTML (`wikipong-landing.html`, `wikipong-quiz.html`,
> `wikipong-home-v2.html`) são **anteriores** à maioria destas decisões. Eles valem como referência
> de **lógica** (ver D-15), mas **não** de copy, navegação, tipografia ou features.
> A fonte da verdade visual é o Figma: página **"WikiPong v2 · Verde-mesa"**.

---

## D-01 · Fonte da verdade

**Decisão:** o Figma v2 ("WikiPong v2 · Verde-mesa") é a fonte única de verdade de visual, copy e
estrutura. Os protótipos HTML estão aposentados como referência visual.

**Porquê:** manter duas fontes sincronizadas é manutenção dupla de artefato descartável; o protótipo
é andaime — já respondeu as perguntas para as quais foi construído.

**Substitui:** o papel dos HTML como fonte da verdade (eram a referência da reconstrução do Figma).

**Status:** ativa.

---

## D-02 · Posicionamento e copy (Opção C)

**Decisão:** a promessa central é o **método**, não o modelo de comércio:
título *"Feito pra explicar, não pra empurrar."*, bullet *"Recomendação explicada, nunca imposta"*.
O card de dor nº 3 é *"Critério invisível"*.

**Porquê:** o modelo de negócio está em aberto (ver D-06). Hardcodar "não vendemos nada" na copy
fecharia opções futuras — a promessa deve depender da abstração estável (explicar com transparência),
não da implementação volátil (vender ou não). Inversão de dependência aplicada a copy.

**Substitui:** copy antiga dos protótipos: *"Uma enciclopédia, não uma loja"*, *"O WikiPong não vende
nada"*, *"Sem estoque pra empurrar"*, card *"Opinião com viés"* (culpava lojas — que podem virar parceiras).

**Status:** ativa.

---

## D-03 · Arquitetura de navegação

**Decisão:** barra desktop com 4 itens + busca + botão:
- **Materiais ▾** (mega-menu): Lâminas · Borrachas · **Mesas** · Conjuntos · Acessórios · **Comparar**
- **Aprender ▾** (mega-menu): Videoaulas · Guias · Glossário
- **Comunidade** (link direto)
- **Notícias** (link direto)
- Botão destacado: **Fazer o teste** (conversão principal)

No mobile: hambúrguer → drawer com os mesmos grupos em acordeão (mesma arquitetura de informação,
embalagem diferente). Comparar mora dentro de Materiais (é ação sobre materiais). Comunidade e
Notícias ficam soltas na barra por serem alavancas de retorno/hábito.

**Porquê:** o produto tem 7+ áreas; barra horizontal crua não escala e hambúrguer no desktop é
anti-padrão (esconde navegação que caberia à vista). Agrupar por intenção resolve os dois lados.

**Substitui:** nav antiga dos protótipos: `Materiais · Comparar · Guias`.

**Status:** ativa.

---

## D-04 · Tipografia

**Decisão:** **Archivo** (display) + **Inter** (corpo) + **JetBrains Mono** (dados, números,
eyebrows, breadcrumbs, metadados).

**Porquê:** JetBrains Mono venceu comparação on-canvas contra IBM Plex Mono, DM Mono, Space Mono e
Spline Sans Mono como a "voz dos dados".

**Substitui:** IBM Plex Mono (usada nos protótipos HTML).

**Status:** ativa, com ressalva — JetBrains foi marcada como *"por enquanto"*; se mudar, trocar
apenas a fonte de dados, o papel (data-voice) permanece.

---

## D-05 · Marca

**Decisão:** logo vetorial novo — raquete inclinada (~22°) majoritariamente verde com cunha escura,
cabo conectado, bola-anel no topo-direita, três tracinhos de velocidade. Wordmark: **Wiki** (tinta)
+ **Pong** (acento), Archivo Bold. Componentes no Figma: `Logo / Ícone` e `Logo / Completo`.

**Porquê:** vetor puro ligado aos tokens de cor — nítido de favicon a outdoor; recriado fiel à
referência do fundador.

**Substitui:** placeholder antigo (bolinha + texto) dos protótipos e do Figma v1.

**Status:** ativa. Pendência: variante compacta do ícone para favicon (tracinhos e anel somem em
tamanhos minúsculos).

**Implementação:** exportar SVG direto do Figma e embutir no código (não recriar à mão).

---

## D-06 · Modelo de negócio

**Decisão:** **em aberto de propósito.** Ordem de preferência atual:
1. **Afiliado/parcerias com lojas** (reversível, barato, sem estoque) — bloco "Onde comprar" com tag
   `PARCEIRO` explícita + disclaimer de independência editorial (padrão Wirecutter).
2. **Curso/videoaulas pagas** (monetiza conhecimento, zero conflito com neutralidade).
3. Revenda própria: apenas se um dia fizer sentido operacional; decisão quase irreversível em
   percepção — não antecipar.

**Porquê:** cada caminho cobra um preço diferente da mesma moeda (confiança). Afiliado com
transparência vende distribuição, não opinião.

**Regra derivada:** nenhuma copy, componente ou código deve prometer "não vendemos" nem assumir
e-commerce próprio.

**Status:** ativa (decisão final de monetização pendente).

---

## D-07 · Especialista

**Decisão:** parceria com especialista em materiais para validar conteúdo. Materializações:
- Selo **"Ficha revisada por especialista"** (componente `Selo / Revisado`) nas fichas.
- O especialista **assina tabelas de configuração**, não código: limiares número→bolinhas,
  limiares número→palavra, tabela de conversão de dureza, pesos da fórmula do Perdão,
  durabilidades de referência, e os textos "Em português claro".

**Porquê:** multiplicador de credibilidade + human-in-the-loop da base que alimenta a IA
(garbage in, garbage out).

**Status:** ativa; parceria ainda não fechada — o nome no selo é placeholder.

---

## D-08 · Modo Simples ↔ Técnico

**Decisão:** um único modelo de dados canônico (specs numéricas técnicas) + **tabelas de lookup**
+ **dois renderers**. Técnico = números/decimais/barras; Simples = bolinhas (cards),
palavras (tabelas) e traduções de rótulo: Spin→**Efeito**, Dureza→**Sensação** (macia/média/dura),
Classe→**Tipo**. Cards Simples ganham a linha *"pra quem é"*.

**Porquê:** é i18n de expertise — o "locale" é o nível do jogador. Estado canônico único evita
dessincronização; tabelas de lookup são configuração validável pelo especialista (D-07).

**Regras derivadas:**
- O estado do modo **persiste site-wide** (localStorage/context) — quem escolheu Simples no
  catálogo espera Simples na comparação.
- No Figma, os modos são frames separados (Catálogo/Comparação × Técnico/Simples); no código,
  **um componente com prop `modo`**.

**Status:** ativa.

---

## D-09 · Métricas derivadas (PROPOSTA V1 — A VALIDAR)

**Decisão:** além das specs de fabricante, exibir métricas derivadas com fórmula aberta
(documentadas no board Figma "Métricas · Derivadas"):

| Métrica | Fórmula v1 | Nota |
|---|---|---|
| **Perdão** (0–10) | `0.5·controle + 0.3·(10 − velocidade) + 0.2·maciez` | pesos a calibrar pelo especialista |
| **Custo/mês** | `preço_médio ÷ durabilidade_meses` | referência: jogador 3×/semana; Tensor ≈ 4 meses, Clássica ≈ 10 |
| **Trajetória** | categórica {baixa, média, alta}, atribuição editorial | sem medição padronizada pública |
| **Dureza unificada** | tabela de conversão entre escalas (ex.: 36° Butterfly ≈ 47° ESN) | exibir unificada + original entre parênteses |

**Porquê:** notas 0–10 de fabricante são escalas internas de marketing (não comparáveis entre
marcas); dureza usa durômetros distintos por marca. As derivadas compõem dados medidos em métricas
que iniciante e avançado entendem — Perdão é a métrica que o iniciante precisa e nenhum fabricante
publica; custo/mês é a única escala universal (dinheiro).

**Regras de apresentação:**
- Destaque de máximo por linha = **fato**, não veredito ("maior ≠ melhor — depende do seu jogo").
- **Custo/mês sem destaque** (a convenção marca o maior; no custo, maior é pior).
- Toda derivada leva asterisco + nota de rodapé declarando estimativa v1.

**Flywheel:** o formulário de avaliação (D-11) pergunta *velocidade percebida* e *meses até trocar*
— calibram as notas de fabricante e a durabilidade real. As métricas se autocorrigem com volume.

**Status:** proposta v1, pendente validação do especialista. **Não remover os carimbos "A VALIDAR"
até a assinatura.**

---

## D-10 · Assistente IA

**Decisão:** a IA **não é item de menu**. Casa dela:
1. **FAB flutuante** persistente (canto inferior direito, todas as páginas) → painel lateral de chat.
2. **Entradas contextuais** nas páginas ("Pergunte sobre esta borracha") — o chat abre já sabendo o
   contexto.
3. (Futuro) busca híbrida "busque ou pergunte" — não misturar cedo.

**Grounding obrigatório:** o assistente nunca responde spec "de cabeça" — consulta a base própria
(RAG/tool calls). Ordem de rollout do corpus: **Glossário** (pequeno, sem risco de "spec errada") →
fichas técnicas → avaliações da comunidade (sempre rotuladas como opinião, D-14).

**Porquê:** IA inventando spec destruiria exatamente a confiança que é a tese do produto.

**Status:** ativa (feature futura; componente `IA / Botão flutuante` já existe no Figma).

---

## D-11 · Avaliações da comunidade

**Decisão:** avaliações **estruturadas**, não comentário livre: nível do jogador + tempo de uso +
nota + texto (+ futuras perguntas de calibração do flywheel, D-09).

**Modelo:** `avaliacoes(id, material_id, usuario_id, nota, texto, nivel, tempo_uso, criado_em, status)`
com `status ∈ {pendente, aprovado, removido}`.

**Regras:**
- **Pré-moderação** enquanto o volume for baixo (fila de aprovação = primeiro admin interno).
- Agregados (média ★, contagens por nível) são **sempre derivados**, nunca digitados.
- **Filtro por nível** na UI (default = perfil do quiz do usuário).
- Ordenação "mais úteis" por **intervalo de Wilson** (não contagem bruta de 👍 — enviesa pra antigas).
- Comunidade semente: alunos da FitPong (possível selo "verificado").

**Porquê:** comentário solto é a "opinião por aí" que o produto critica; estrutura transforma
opinião em dado — e uma Tenergy vale 5★ pro avançado e 2★ pro iniciante: sem contexto de nível,
a média mente.

**Status:** ativa (design pronto; formulário de escrever avaliação pendente — campos estruturados
primeiro, texto por último).

---

## D-12 · Estado na URL

**Decisão:** estado navegável vive na URL:
- Filtros do catálogo: `/catalogo?vel=6-8&ctrl=7&marca=butterfly`
- Resultado do quiz → preset de filtros: o CTA do resultado aponta pro catálogo com query params.
- Comparação: `/comparar?ids=tenergy-05,mark-v`

**Porquê:** compartilhável, back-button grátis, zero estado no servidor. Filtros = **fonte única de
verdade** (um objeto de estado; sidebar, chips, contagem e grid são views derivadas dele).

**Status:** ativa.

---

## D-13 · Dados de ofertas e afiliados

**Decisão:**
- Oferta é **entidade própria**: `ofertas(material_id, loja_id, preco, url_afiliado, atualizado_em)`.
- "Preço médio" = agregado derivado (AVG das ofertas ativas), nunca manual.
- Clique de afiliado passa pelo próprio servidor: `/ir/:oferta_id` → loga → `302` pra loja
  (métricas próprias, independentes do relatório da loja).
- **Snapshotar preços desde o dia 1**, mesmo sem exibir (histórico é feature futura; dado temporal
  não se recupera retroativamente).
- Nunca fingir frescor: exibir timestamp real de atualização.

**Status:** ativa.

---

## D-14 · Separação editorial (fato × opinião)

**Decisão:** a ordem das seções na página de detalhe é declaração editorial:
**ficha técnica (fato) → "Em português claro" (tradução) → Onde comprar (ação) → Comunidade
(opinião, rotulada, por último)**. A seção de avaliações carrega a linha *"separada da ficha
técnica, que é independente"*.

**Porquê:** integridade editorial em layout; o assistente IA (D-10) herda a mesma disciplina
("a ficha diz X; a comunidade relata Y").

**Status:** ativa.

---

## D-15 · Colheita dos protótipos HTML

**Decisão:** os protótipos não serão sincronizados; serão **colhidos** — a lógica válida migra
direto pro código de produção.

**Colher (lógica ainda válida):**
- Máquina de estados do quiz (fork iniciante/avançado/explorar, telas de resultado).
- Motor de filtros facetados do catálogo.
- Radar em canvas com animação de draw-in.
- Tratamento de `prefers-reduced-motion` e o padrão de micro-interações.

**Ignorar (superado por decisões acima):**
- Toda a copy (D-02), navegação (D-03), IBM Plex Mono (D-04), marca antiga (D-05).
- Ausência de: FAB da IA, modo Simples nos cards, avaliações, Onde comprar/Selo, métricas derivadas.

**Ordem sugerida de colheita:** quiz primeiro (lógica mais completa e mais isolada).

**Status:** ativa.

---

## D-16 · Lançamento honesto

**Decisão:**
- Itens de navegação de áreas que não existirem no lançamento ficam **ocultos** (não link morto,
  não "em breve" clicável na nav). Os "EM BREVE" vivem na grade de features da landing.
- Métricas derivadas só entram no ar **após** validação do especialista (D-09) — até lá, ou não
  aparecem, ou aparecem com o carimbo de proposta.
- Timestamps sempre reais (D-13).

**Porquê:** a tese do produto é confiança; mentiras pequenas de UI (link morto, frescor falso,
precisão fingida) são as que matam a tese primeiro.

**Status:** ativa.

---

## Como manter este arquivo

1. **Uma entrada por decisão, no momento em que ela é tomada** — não em lote retroativo.
2. Decisão revertida não é apagada: muda o status para `substituída por D-XX` (histórico é o valor).
3. Quando o repositório existir: este arquivo vai na raiz, e o `CLAUDE.md` do projeto deve
   apontar para ele ("leia DECISOES.md antes de usar os protótipos HTML como referência").
4. Se crescer demais, dividir em `/docs/adr/DDDD-titulo.md` (padrão ADR clássico).

---

## D-17 · Stack técnica (ATIVA)

**Decisão:** **Next.js (App Router) + React + TypeScript** com **export estático**
(`output: 'export'` → HTML pré-renderizado por rota em `out/`). Dados iniciais como
**JSON estático versionado** no repo (`dados/*.json`); deploy do `out/` em host estático
(Cloudflare Pages / Vercel), mantendo zero ops. Backend adiado — entra (Supabase/Postgres)
quando as avaliações da comunidade (D-11) exigirem escrita/moderação.

**Porquê:** o WikiPong é uma enciclopédia — distribuição depende de SEO (fichas, glossário e
guias precisam ser indexáveis). Um SPA puro renderiza HTML vazio no cliente e perde
indexação/first-paint; o SSG do Next entrega HTML por rota desde o dia 1, mantendo o mesmo
React que o dev solo já domina e o mesmo custo/zero-ops do static-first. A lógica de negócio
segue em módulos puros (`src/logica/`), consumida pela UI sem alteração — portável, não
condicionada à stack.

**Substitui:** a proposta original desta mesma D-17 (Vite + React SPA). O trade-off decisivo
foi SEO/SSG vs. simplicidade do SPA — escolhido o Next porque, para conteúdo de enciclopédia,
ser achado é requisito e não enfeite, e o Next preserva React + deploy estático + zero ops.
Astro foi descartado: o produto é muito interativo (quiz, filtros, radar, comparação, chat,
modo Simples/Técnico site-wide, D-08) e o modelo de ilhas geraria atrito.

**Emenda (2026-07-07):** decidida em conjunto (fundador + Claude Code) após apresentação de
trade-offs. Scaffold montado e verificado: `npm run build` gera `out/` com `/` e `/quiz`
estáticas; a home renderiza as métricas de `src/logica/metricas.ts` em build time (SSG) e o
`/quiz` dirige a máquina de estados de `src/logica/quiz.ts` no cliente — **ambos os módulos
intocados** (46 asserções da colheita seguem verdes). Fontes da D-04 via `next/font`.

**Status:** ativa.

---

## D-18 · Liberdade de design na implementação

**Decisão:** o agente de implementação (Claude Code) tem liberdade para usar suas
skills de front-end e UI/UX e **melhorar o design em qualquer aspecto** — polimento,
micro-interações, responsividade, acessibilidade, hierarquia, estados. O Figma passa
a ser **piso, não teto**: documenta identidade e mínimo aprovado, não limita a qualidade.

**Porquê:** o Figma v2 foi construído por scripts com foco em estrutura e sistema;
a camada fina de excelência visual (motion, estados, detalhes responsivos) rende mais
sendo feita no meio final (código), onde é nativa e testável.

**Guarda-corpos:** identidade Verde-mesa (tokens/fontes/marca) como base; divergências
significativas são aplicadas **e registradas** (trilha para sync de volta ao Figma);
D-02, D-14 e D-16 permanecem invioláveis; acessibilidade é requisito, não opcional.

**Emenda:** refina a D-01 (fonte da verdade visual = identidade e estrutura; execução
visual pode superá-la).

**Nota de sync — tema escuro, alias e radar do hero (2026-07-09):** três divergências
aplicadas na passada de design (regra 2 desta decisão):
1. **Tema escuro** via `prefers-color-scheme` com tokens derivados do verde-mesa
   (superfícies dessaturadas com tom de verde, não inversão) — o Figma ainda não define
   tokens escuros; **pendente de olho do fundador e sync ao Figma**.
2. **Alias semântico `--cor-texto-acento`** (claro→acento-escuro; escuro→acento),
   concretizando a trilha prevista na nota de contraste abaixo. Componentes usam o alias.
3. **Radar decorativo no hero** (2 polígonos sobrepostos, dados reais em build time,
   Perdão incluído com asterisco A VALIDAR; `aria-hidden` — a tabela é a alternativa
   acessível; sólido × tracejado, distinguível sem cor). Ensaia o componente Radar (D-15).

**Nota de sync — uso do acento (2026-07-09):** o acento claro `--cor-acento` (#1FA06A)
tem contraste ~3.2:1 sobre o papel — **reprova** WCAG AA em texto pequeno/normal (exige
4.5:1). Regra adotada: **texto pequeno/corpo e fundos de botão usam `--cor-acento-escuro`**
(#157A4F, ~5.1:1). O acento claro fica para **preenchimentos** (barras, gráficos), **bordas**,
**anel de foco** (componente UI, exige só 3:1) e o **wordmark** (logotipo é isento). **Nuance:**
**texto grande/display pode usar o acento claro** — AA para texto grande (≥ 24px, ou ≥ 18.66px
bold) exige apenas 3:1, que o acento passa. Trilha para eventual token semântico no Figma
(ex.: `texto-acento` = escuro; `superficie-acento` = claro).

**Status:** ativa.
