# WikiPong 🏓

**Enciclopédia PT-BR de equipamentos de tênis de mesa — feita pra explicar, não pra empurrar.**

Notas de fabricante são escalas internas de marketing: o 9.0 de uma marca não é o 9.0 da
outra. O WikiPong existe pra resolver isso — cada material ganha uma ficha neutra e
padronizada, comparável de verdade, escrita pra ser entendida por quem está começando e
respeitada por quem é detalhista.

## O método

- **Specs canônicas** + **métricas derivadas de fórmula aberta** — como o *Perdão*
  (a métrica que o iniciante precisa e nenhum fabricante publica) e o *custo/mês*
  (a única escala universal: dinheiro). Toda derivada leva o carimbo **A VALIDAR**
  até o especialista assinar.
- **Modo Simples ↔ Técnico**: o mesmo dado canônico em dois renderers — números pra
  quem quer detalhe, bolinhas e português claro pra quem está chegando.
- **Fato separado de opinião**: a ordem das seções é declaração editorial — ficha
  técnica primeiro, comunidade (rotulada) por último.
- **Recomendação explicada, nunca imposta**: o teste de perfil gera filtros abertos
  (visíveis na URL), e cada ficha mostra critério por critério se o material combina
  — ou não — com cada perfil.
- **Estado na URL**: filtros, comparações e presets são compartilháveis; back-button
  de graça.

## Stack

[Next.js](https://nextjs.org) (App Router) + React + TypeScript com **export estático**
— todas as rotas pré-renderizadas no build, deploy em qualquer host estático. A lógica
de negócio vive em **módulos puros** ([`src/logica/`](src/logica/)) sem DOM nem
framework, cobertos por testes que reproduzem os números publicados no design.

```bash
npm install
npm run dev     # desenvolvimento — http://localhost:3000
npm run build   # export estático em out/
npm test        # testes da lógica pura
```

## Documentos do projeto

| Arquivo | Papel |
|---|---|
| [`DECISOES.md`](DECISOES.md) | Registro de decisões (ADR) — **a lei do projeto** |
| [`PRODUCT.md`](PRODUCT.md) | Estratégia: usuários, personalidade, princípios |
| [`DESIGN.md`](DESIGN.md) | Sistema visual "A Mesa Oficial": tokens, regras, do's & don'ts |
| [`CLAUDE.md`](CLAUDE.md) | Guia para agentes de código |

## Status

🚧 **Pré-lançamento.** A base de materiais atual é semente (9 itens, colhidos dos
protótipos) e os valores de dureza/derivadas aguardam validação de especialista.
Avaliações da comunidade, ofertas de parceiros e o assistente IA estão no roadmap —
e, por princípio, nada disso aparece na navegação antes de existir.
