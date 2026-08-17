# CLAUDE.md — WikiPong

Enciclopédia PT-BR de equipamentos de tênis de mesa. Fundador: Guilherme (dev solo,
também gere a academia FitPong).

## Leia primeiro
1. **DECISOES.md** — o registro de decisões (ADR). É a lei do projeto; em conflito
   com qualquer outra fonte (inclusive protótipos), o DECISOES.md vence.
2. A fonte da verdade **visual** é o **site publicado** (D-21, decisão do fundador em
   2026-08-16). Coisa nova se desenha a partir do que já está no ar — não do Figma, que
   virou registro histórico de onde a identidade saiu.

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
- ✅ `src/logica/metricas.ts` — derivadas (custo/mês, maciez) + tabelas Simples/Técnico
- ✅ `src/logica/filtros.ts` — motor de filtros facetado (faixas + facetas + sort) com
  parse/serialize de query string compatível com os presetURL do quiz (D-12); importa
  `metricas` p/ o sort por Perdão; testes cobrem os 4 perfis
- ✅ `componentes/Radar.tsx` — overlay de 2 polígonos (sólido × tracejado), draw-in,
  aria-hidden (a tabela é a alternativa acessível); usado no hero e no `/comparar`

**Colheita CONCLUÍDA.** Consumo: `/catalogo` usa `filtros.ts` (URL = fonte única, D-12,
via pushState + useSearchParams); `/comparar?ids=` usa o Radar + `metricas.ts`;
`dados/materiais.json` é a semente colhida do protótipo.

## Convenções
- **PT-BR em tudo**: nomes de arquivos, funções, variáveis, comentários, commits.
- Lógica de negócio = **módulos puros** em `src/logica/` (sem DOM, sem framework).
- Tabelas de lookup (limiares, conversões, pesos) são **configuração exportada**,
  num lugar só, para poderem ser revistas sem caçar número espalhado pelo código.
  **Não carimbe mais `A VALIDAR`** (decisão do fundador, 2026-08-04): o selo
  prometia um aval sem data nem responsável, e um aviso permanente de "isto ainda
  não vale" ensina o leitor a não confiar em nada da página. O que continua
  obrigatório é dizer a PROCEDÊNCIA — de onde o número veio e com que régua.
- Estado navegável vive na **URL** (D-12).
- **Dado verdadeiro, específico e com procedência** (decisão do fundador,
  2026-08-09): nada de campo vazio, nada de resumo genérico. Quando falta um
  número, a ordem é: (1) **buscar na fonte** — campo vazio quase sempre é
  colheita preguiçosa, não dado inexistente; (2) se a fonte não publica, **dizer
  o que não se sabe e por quê**, no lugar do traço mudo; (3) **nunca** preencher
  com número inventado ou convertido sem régua declarada — `Specs` é opcional no
  tipo justamente porque inventar é pior que faltar (D-16). O texto do modo
  Simples segue a mesma regra: frase daquele material, nunca modelo com o nome
  trocado.

## Comandos
- Testes: `npx tsx testes/rodar.ts` — rede de regressão da lógica. As asserções numéricas
  (métricas derivadas, quiz) nasceram dos números do board "Métricas · Derivadas" do Figma e
  **continuam valendo**: são os números que o site publica hoje, e mudá-los sem querer é bug.
  Isso não é fidelidade ao desenho (ver D-21) — é a conta não poder mudar sozinha.

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
**Não há piso externo: há o site.** O que define a identidade é o que está no ar —
tokens, cartão mesa, o seletor de material com busca, as caixas de ressalva, a voz
mono para dado. O Figma não é mais consulta obrigatória (D-21).

Regras do jogo:
1. **Identidade Verde-mesa é o ponto de partida**: tokens de cor, Archivo/Inter/
   JetBrains Mono e a marca. Evoluir a partir dela, não substituí-la em silêncio.
   Antes de inventar um padrão novo, procure o equivalente que já existe no site —
   componente repetido é o defeito que mais custou caro aqui (o `<select>` cego de
   material sobreviveu em três telas depois de já existir o `SeletorMaterial`).
2. Melhorias pontuais: aplique direto. **Divergências significativas** (mudar um
   componente do design system, alterar layout de uma tela, nova direção visual):
   aplique E registre numa nota de decisão — não há mais sync de volta ao Figma
   (D-21), e nota de decisão é onde alguém vai procurar depois.
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
