---
name: WikiPong
description: Enciclopédia PT-BR de tênis de mesa — a mesa oficial como sistema visual
colors:
  papel: "#FAFAF9"
  superficie: "#FFFFFF"
  superficie-2: "#EDF2E9"
  tinta: "#283027"
  tinta-suave: "#49514A"
  mudo: "#7C857A"
  linha: "#E4EADE"
  linha-forte: "#D3DBCB"
  acento: "#1FA06A"
  acento-escuro: "#157A4F"
  acento-suave: "#E6F4EC"
  mesa: "#0F3F2C"
  mesa-borda: "#1C5E40"
  sobre-mesa: "#EEF6F0"
  sobre-mesa-suave: "#A7CBB5"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 6.5vw, 5rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 4.2vw, 2.4rem)"
    fontWeight: 800
    lineHeight: 1.08
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.55
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.5
  stat:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 500
    fontFeature: "'tnum' 1"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 500
    letterSpacing: "0.14em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.05rem"
    fontWeight: 500
    fontFeature: "'tnum' 1"
rounded:
  sm: "9px"
  md: "13px"
  lg: "18px"
  pill: "999px"
spacing:
  esp-1: "4px"
  esp-2: "8px"
  esp-3: "12px"
  esp-4: "16px"
  esp-5: "24px"
  esp-6: "32px"
  esp-7: "48px"
  esp-8: "64px"
components:
  botao-primario:
    backgroundColor: "{colors.acento-escuro}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.15rem"
    height: "44px"
  botao-primario-hover:
    backgroundColor: "#126B45"
  botao-secundario:
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.15rem"
    height: "44px"
  chip-faixa:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "999px"
    padding: "0.35rem 0.8rem"
  chip-faixa-ativa:
    backgroundColor: "{colors.acento-escuro}"
    textColor: "#FFFFFF"
    rounded: "999px"
  cartao-material:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.md}"
    padding: "1.1rem"
---

# Design System: WikiPong

## 1. Overview

**Creative North Star: "A Mesa Oficial"**

O site É a mesa de jogo. As superfícies profundas verde-mesa (`#0F3F2C`) com textura
sutil de pinos de borracha, a linha central tracejada como divisor-assinatura e o papel
quase-branco funcionando como súmula: cada página é uma partida bem arbitrada, onde os
números são fatos e a opinião joga rotulada. A identidade "Verde-mesa" vem do Figma
(D-01) e é **piso, não teto** (D-18): evolui com craft, nunca é substituída em silêncio.

O sistema serve dois temas (claro e escuro via `prefers-color-scheme`) com os mesmos
tokens semânticos — e as bandas mesa são **invariantes entre temas** (a mesa é escura
por natureza). Este sistema rejeita explicitamente o visual de "SaaS genérico de IA"
(anti-referência do PRODUCT.md): sem gradientes decorativos, sem glassmorphism, sem
kicker em toda seção, sem grid de cards idênticos.

**Key Characteristics:**
- Verde-mesa carrega superfícies inteiras (banda de métricas, rodapé), não só detalhes
- Mono = voz de DADOS (progresso, contagem, trilha) — nunca ornamento
- Motivos do domínio: linha central, pinos de borracha, radar sólido×tracejado
- Dois temas com AA verificado; alias `--cor-texto-acento` resolve o acento por tema
- Componentes táteis e confiantes: feedback físico contido, sem teatro

## 2. Colors

Paleta verde-mesa: neutros com tom de verde, um acento e a mesa como superfície própria.

### Primary
- **Acento (Verde-mesa)** (#1FA06A): preenchimentos, bordas ativas, anel de foco,
  wordmark, barra de progresso. Em TEXTO só via alias (ver Regra do Acento).
- **Acento-escuro** (#157A4F): fundo de botão primário (branco sobre ele passa AA nos
  2 temas) e texto acentuado no tema claro.
- **Acento-suave** (#E6F4EC): fundos de chip ativo, selos e caixas de destaque.

### Secondary
- **Mesa** (#0F3F2C): a superfície-assinatura — banda de métricas da home e rodapé,
  com textura de pinos (radial-gradient 18px). Invariante entre temas.
- **Mesa-borda** (#1C5E40) · **Sobre-mesa** (#EEF6F0, 11.6:1) · **Sobre-mesa-suave**
  (#A7CBB5, 6.7:1): estrutura e texto sobre a mesa.

### Neutral
- **Papel** (#FAFAF9): fundo do corpo. **Superfície** (#FFFFFF): cartões e tabelas.
  **Superfície-2** (#EDF2E9): cabeçalhos de tabela, camada de apoio.
- **Tinta** (#283027) texto principal · **Tinta-suave** (#49514A) secundário ·
  **Mudo** (#7C857A) metadados/rotulagem decorativa.
- **Linha** (#E4EADE) e **Linha-forte** (#D3DBCB): fios e bordas.

Tema escuro: variantes derivadas (dessaturadas com tom de verde, nunca inversão) vivem
em `app/globals.css` e no sidecar `.impeccable/design.json`.

### Named Rules
**A Regra do Acento.** Texto acentuado usa o alias `--cor-texto-acento` (claro →
acento-escuro; escuro → acento). O acento claro direto é PROIBIDO em texto pequeno
(3.19:1, reprova AA); permitido só em preenchimentos, bordas, anel de foco, wordmark
e display ≥24px.

**A Regra da Mesa.** A cor da identidade carrega superfícies inteiras, não migalhas.
Bandas mesa são invariantes entre temas. A linha central tracejada aparece 1-2 vezes
por página, nunca mais — é assinatura, não padrão de fundo.

## 3. Typography

**Display Font:** Archivo (com system-ui)
**Body Font:** Inter (com system-ui)
**Label/Mono Font:** JetBrains Mono (com ui-monospace) — a "voz dos dados" (D-04)

**Character:** Display geométrico e pesado (800) contra corpo humanista calmo; o mono
entra como terceira voz, exclusiva de informação — números tabulares, progresso,
trilhas. Contraste por eixo (peso + gênero), nunca duas sans parecidas competindo.

### Hierarchy
- **Display** (800, clamp(2.4rem→5rem), 1.08, -0.015em): só o hero da home.
- **Headline** (800, clamp(1.6rem→2.4rem)): títulos de página e de seção.
- **Title** (700, 1.12rem): nomes de material em cards, termos do glossário.
- **Body** (400, 1rem, 1.6): prosa; máx. 52–68ch (`text-wrap: pretty` em ledes).
- **Small** (400, 0.9rem): descrições densas em cards e listas.
- **Caption** (400, 0.8rem): notas de rodapé, trilhas, microcopy.
- **Stat** (mono 500, 1.5rem, tnum): números de destaque (faixa de estatísticas).
- **Label** (500, 0.72rem, +0.14em, CAIXA-ALTA): rótulos mono funcionais.
- **Data** (500, 1.05rem, tnum): valores numéricos em tabelas e cards.

### Named Rules
**A Regra da Voz de Dados.** O mono marca INFORMAÇÃO (progresso "Pergunta 1 de 3",
contagem "9 materiais", trilha "Aprender / Glossário"). Kicker mono decorativo acima
de seção foi aposentado — se o rótulo não carrega dado, ele não existe.

## 4. Elevation

Plana por padrão. A profundidade vem de CAMADAS DE TOM (papel → superfície →
superfície-2 → mesa), não de sombra. Existe uma única sombra ambiente
(`--sombra-cartao: 0 1px 2px rgba(40,48,39,0.06), 0 8px 24px rgba(40,48,39,0.06)`)
cujo papel é descolar cartões do fundo — nunca estruturar hierarquia. No tema escuro
ela escurece (rgba(0,0,0,0.4/0.35)) e o tom assume quase todo o trabalho.

### Named Rules
**A Regra do Plano.** Sombras não criam hierarquia; tom cria. Se um elemento precisa
"subir", ele muda de camada tonal (ou vai para a mesa), não de blur. O header sticky é
a exceção deliberada: ganha sombra scroll-driven ao rolar, porque ali a sombra É estado.

## 5. Components

Sensação-alvo: **táteis e confiantes** — o controle responde ao toque com física
contida (hover -1px/-2px, press scale 0.98, 160ms ease), e novos componentes podem
acentuar essa fisicalidade; o que não muda é a ausência de teatro (registro product).

### Buttons
- **Shape:** cantos médios ({rounded.md} = 13px), alvo ≥ 44px.
- **Primary** (`.botao-primario`, utilitário global): acento-escuro + branco,
  padding 0.6rem 1.15rem; hover escurece 12% (color-mix); active scale(0.98);
  disabled opacity 0.45. NUNCA recriar por módulo — é utilitário do sistema.
- **Secondary** (`.botao-secundario`): fantasma com borda linha; hover borda acento.

### Chips (filtros do catálogo)
- **Style:** pílula (999px), superfície + borda linha-forte.
- **State:** ativa = acento-escuro + branco (`aria-pressed`); removível mostra "×".
  Sob `pointer: coarse`, padding sobe para alvo ≥ 44px.

### Cards / Containers
- **Corner Style:** {rounded.md} (13px).
- **Background:** superfície sobre papel; sobre a mesa, o cartão branco "flutua".
- **Shadow Strategy:** só a sombra ambiente (ver Elevation).
- **Border:** 1px linha (linha-forte em tabelas).
- **Internal Padding:** ~1.1rem; preço separado por fio superior.

### Inputs / Fields
- **Style:** select/checkbox nativos estilizados (accent-color acento-escuro),
  borda linha-forte, {rounded.sm}.
- **Focus:** anel global de 3px no acento com offset 2px (`:focus-visible`).

### Navigation
- Cabeçalho sticky com blur, logo oficial SVG (fills em tokens — adapta por tema e
  por escopo), links com `aria-current` (borda inferior acento), CTA primário
  compacto. Sombra scroll-driven (`animation-timeline: scroll()`) como progressive
  enhancement. Rodapé mesa com remapeamento de tokens no escopo.

### Radar (componente-assinatura)
Overlay de 2 polígonos — sólido (acento + fill 13%) × tracejado (tinta-suave) —
distinguíveis SEM cor; draw-in de 700ms; SEMPRE `aria-hidden` com tabela como
alternativa acessível. Eixos em mono 9px. Usado no hero (SSG) e no /comparar.

## 6. Do's and Don'ts

### Do:
- **Do** usar `--cor-texto-acento` para todo texto acentuado (A Regra do Acento).
- **Do** testar contraste nos DOIS temas ao mexer em cor (AA é piso; a banda mesa
  tem contrastes fixos: 11.6:1 / 6.7:1).
- **Do** dar aos controles feedback físico contido (hover lift, press 0.98, 160ms)
  com `prefers-reduced-motion` sempre respeitado.
- **Do** marcar derivadas com asterisco + A VALIDAR, e destacar o "maior" como fato
  ("maior ≠ melhor"); custo/preço NUNCA recebe destaque de máximo (D-09).
- **Do** usar os utilitários do sistema (`.botao-primario`, `.botao-secundario`,
  `.trilha`, `.linha-central`) em vez de recriar por módulo.

### Don't:
- **Don't** parecer "SaaS genérico de IA" (anti-referência do PRODUCT.md): gradiente
  decorativo, gradient text, glassmorphism, hero-metric, grid de cards idênticos.
- **Don't** ressuscitar o kicker mono decorativo acima de seções (aposentado).
- **Don't** parecer "loja que empurra" (urgência, promoção, compre-agora) nem
  "review site caótico" — e nenhuma copy pode prometer "não vendemos" (D-02/D-06).
- **Don't** usar side-stripe (border-left colorida >1px) em cards/alertas.
- **Don't** esconder conteúdo atrás de animação (reveal só melhora o já-visível).
- **Don't** usar acento claro (#1FA06A) em texto pequeno sobre papel — 3.19:1, reprova.
- **Don't** deixar link morto ou "em breve" clicável na nav (D-16): o que não existe
  não entra.
- **Don't** sublinhar TEXTO com o tracejado da linha central: tracejado sob palavra é
  a convenção visual de abbr/tooltip e promete uma definição que não existe (decisão
  do fundador, 2026-07-14). A linha central vive em divisores e no rodapé.
