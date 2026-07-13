# Product

## Register

product

## Platform

web

## Users

Mesatenistas brasileiros decidindo em qual equipamento investir, em dois polos:

- **Iniciante/intermediário** — não sabe ler specs ("dureza 47° é bom?"). Precisa de
  tradução (modo Simples, D-08), da métrica que nenhum fabricante publica (Perdão) e de
  recomendação explicada. Chega muitas vezes por busca (SEO é distribuição — D-17).
- **Avançado** — quer números comparáveis entre marcas, sabe que a nota 9.0 de uma marca
  não é a 9.0 da outra, e desconfia de review com viés. Usa o modo Técnico e a comparação.

Contexto: pesquisa de compra (celular e desktop), frequentemente a partir do Google.
Comunidade semente: alunos da academia FitPong do fundador (D-11).

## Product Purpose

Enciclopédia PT-BR de equipamentos de tênis de mesa. Existe porque specs de fabricante
não se comparam entre marcas e a alternativa hoje é "opinião por aí". Sucesso = ser a
referência confiável em português: specs canônicas + métricas derivadas de fórmula
aberta (Perdão, custo/mês — D-09) + tradução em português claro, com a confiança como
ativo central.

O estado navegável vive na URL (compartilhável, back-button grátis — D-12). O modelo de
negócio está **em aberto de propósito** (D-06): nenhuma superfície pode prometer "não
vendemos" nem assumir e-commerce próprio. A home é a vitrine do método — a única
superfície tratada no registro **brand** por tarefa; todo o resto é ferramenta.

## Brand Personality

**Honesta · didática · técnica.** Explica sem empurrar (D-02); separa fato de opinião
na própria estrutura visual (D-14); não mente nem em detalhe de UI (D-16). O lado
técnico nunca chega cru: todo número tem tradução (D-08). Voz dos dados = JetBrains
Mono; display = Archivo; corpo = Inter (D-04).

## Anti-references

- **SaaS genérico de IA** (ênfase do fundador): gradientes decorativos, glassmorphism,
  kicker em toda seção, hero-metric, grid de cards idênticos — se parece template de IA,
  falhou. Aposentados na passada bolder; não reintroduzir.
- Derivadas das decisões: **loja que empurra** (urgência, promoção, "compre agora" —
  contradiz a tese D-02/D-06); **review site caótico** (anúncio por todo lado, nota sem
  critério — é a "opinião por aí" que o produto critica); **IA que inventa spec**
  (o assistente futuro só responde grounded — D-10).

## Design Principles

1. **Explicar, nunca empurrar** — toda superfície responde "por quê" antes de pedir ação;
   recomendação vem com critério visível (D-02).
2. **Fato separado de opinião** — a ordem das seções é declaração editorial: ficha → 
   tradução → ação → comunidade rotulada (D-14).
3. **UI honesta ou nada** — sem link morto, frescor falso ou precisão fingida; derivadas
   levam carimbo A VALIDAR até o especialista assinar (D-16, D-07/D-09).
4. **i18n de expertise** — Simples e Técnico são o mesmo dado canônico em dois renderers;
   o "locale" é o nível do jogador (D-08).
5. **Identidade é piso, não teto** — verde-mesa evolui com craft (banda mesa, linha
   central), nunca é substituída em silêncio; divergência significativa se registra
   no DECISOES.md (D-18).

## Accessibility & Inclusion

WCAG AA como piso nos **dois temas** (claro e escuro — testar contraste separadamente;
regra do acento via `--cor-texto-acento`). `prefers-reduced-motion` em toda animação;
foco visível sempre; navegação por teclado (foco gerenciado no quiz); alvos de toque
≥ 44px (`pointer: coarse` nos controles densos); gráficos sempre com alternativa
acessível em tabela (Radar é aria-hidden por contrato).
