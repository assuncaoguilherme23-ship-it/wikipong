# CLAUDE.md — WikiPong

Enciclopédia PT-BR de equipamentos de tênis de mesa. Fundador: Guilherme (dev solo,
também gere a academia FitPong).

## Leia primeiro
1. **DECISOES.md** — o registro de decisões (ADR). É a lei do projeto; em conflito
   com qualquer outra fonte (inclusive protótipos), o DECISOES.md vence.
2. A fonte da verdade **visual** é o Figma, página "WikiPong v2 · Verde-mesa" (D-01).

## Contexto de design (impeccable)
- **PRODUCT.md** — estratégia: registro `product` (home = exceção brand por tarefa),
  usuários, personalidade (honesta · didática · técnica), anti-referências, princípios.
- **DESIGN.md** — sistema visual: estrela-guia "A Mesa Oficial", tokens, regras nomeadas
  (Regra do Acento, da Mesa, da Voz de Dados, do Plano), do's & don'ts.
  Sidecar renderizável em `.impeccable/design.json`. Ler ambos antes de desenhar telas.

## Protótipos HTML (referência de LÓGICA, não de visual)
Os arquivos `wikipong-*.html` são anteriores à maioria das decisões. Consulte o
**D-15** antes de usá-los: copy, navegação e fonte mono deles estão SUPERADOS.
O que ainda vale colher deles: motor de filtros do catálogo, radar em canvas com
draw-in, padrões de `prefers-reduced-motion`.

## Estado da colheita
- ✅ `src/logica/quiz.ts` — máquina de estados do quiz (grafo + pilha + progresso por branch)
- ✅ `src/logica/metricas.ts` — derivadas (Perdão, custo/mês) + tabelas Simples/Técnico
- ✅ `src/logica/filtros.ts` — motor de filtros facetado (faixas + facetas + sort) com
  parse/serialize de query string compatível com os presetURL do quiz (D-12); importa
  `metricas` p/ o sort por Perdão; testes cobrem os 4 perfis
- ✅ `componentes/Radar.tsx` — overlay de 2 polígonos (sólido × tracejado), draw-in,
  aria-hidden (a tabela é a alternativa acessível); usado no hero e no `/comparar`

**Colheita CONCLUÍDA.** Consumo: `/catalogo` usa `filtros.ts` (URL = fonte única, D-12,
via pushState + useSearchParams); `/comparar?ids=` usa o Radar + `metricas.ts`;
`dados/materiais.json` é a semente colhida do protótipo (dureza A VALIDAR).

## Convenções
- **PT-BR em tudo**: nomes de arquivos, funções, variáveis, comentários, commits.
- Lógica de negócio = **módulos puros** em `src/logica/` (sem DOM, sem framework).
- Tabelas de lookup (limiares, conversões, pesos) são **configuração exportada**,
  sempre com carimbo `A VALIDAR` até o especialista assinar (D-07, D-09).
- Estado navegável vive na **URL** (D-12).

## Comandos
- Testes: `npx tsx testes/rodar.ts` — as asserções reproduzem os números publicados
  no Figma; se divergir do desenhado, o teste quebra de propósito.

## Stack (D-17 — ATIVA)
Next.js (App Router) + React + TypeScript com **export estático** (`output: 'export'`),
dados em JSON estático, deploy do `out/` em host estático. Os módulos de `src/logica/`
são consumidos pela UI sem alteração e não dependem dessa escolha.
- Dev: `npm run dev` · Build/export: `npm run build` (gera `out/`) · Testes: `npm test`.
- SSG por rota (SEO desde o dia 1) foi o motivo de escolher Next sobre SPA — ver D-17.

## Liberdade de design (D-18)
Você TEM ABERTURA para usar plenamente suas skills de front-end e UI/UX para
estilizar e **melhorar o design do site em qualquer aspecto**: polimento visual,
micro-interações e motion, responsividade, acessibilidade, hierarquia tipográfica,
espaçamento, estados de hover/focus/empty/loading e o que mais elevar a qualidade.
O Figma é **piso, não teto** — referência de identidade e mínimo aprovado, não
limite superior.

Regras do jogo:
1. **Identidade Verde-mesa é o ponto de partida**: tokens de cor, Archivo/Inter/
   JetBrains Mono e a marca. Evoluir a partir dela, não substituí-la em silêncio.
2. Melhorias pontuais: aplique direto. **Divergências significativas** (mudar um
   componente do design system, alterar layout de uma tela, nova direção visual):
   aplique E registre em uma nota curta (para eventual sync de volta ao Figma).
3. As decisões de conteúdo/ética continuam valendo: copy (D-02), separação
   fato×opinião (D-14), honestidade de UI (D-16), acessibilidade sempre
   (`prefers-reduced-motion`, contraste, foco visível, navegação por teclado).

**Uso do acento (regra de contraste — ver nota sob D-18):** para TEXTO acentuado use o
alias semântico **`--cor-texto-acento`** (resolve p/ acento-escuro no tema claro e p/ o
acento no escuro — AA nos dois). Fundos de botão: `--cor-acento-escuro` (branco sobre ele
passa AA em qualquer tema). Acento claro direto: só **preenchimentos, bordas, anel de
foco e wordmark**. Exceção: **texto grande/display (≥ 24px, ou ≥ 18.66px bold) pode usar
o acento claro** (AA large = 3:1). O site tem **tema escuro** (`prefers-color-scheme`)
com tokens derivados — teste contraste nos DOIS temas ao mexer em cor.
