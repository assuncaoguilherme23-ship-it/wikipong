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

## Ligar a comunidade (Supabase)

As avaliações, os tópicos e o perfil funcionam **hoje**, gravando no `localStorage`
do navegador — e as telas dizem isso antes de qualquer campo. Para virar público:

1. criar conta e um projeto novo em [supabase.com](https://supabase.com);
2. abrir o **SQL Editor**, colar [`supabase/001-comunidade.sql`](supabase/001-comunidade.sql)
   inteiro e clicar em *Run* (cria tabelas, índices, políticas e a fila de moderação);
3. em **Project Settings → API**, copiar a *Project URL* e a chave *anon public*
   para um arquivo `.env.local` na raiz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
```

Não há código de servidor pra escrever: `repositorio()` escolhe sozinho entre local e
Supabase, e a UI passa a dizer que é público porque lê a flag `somenteLocal`.

### Login e moderação

Rode também [`supabase/002-login.sql`](supabase/002-login.sql). Ele cria a tabela
`admins` e as regras que deixam moderar pelo site em vez do painel.

No painel, em **Authentication → Providers**, deixe **Email** ligado com *magic link*
(é o padrão). Em **Authentication → URL Configuration**, acrescente a URL do site em
*Redirect URLs* — sem isso o link chega mas volta pro lugar errado.

Para virar moderador:

1. entrar uma vez em `/comunidade/moderacao/` com o seu e-mail;
2. no SQL Editor, rodar (trocando pelo seu e-mail):

```sql
insert into public.admins (usuario_id)
select id from auth.users where email = 'voce@exemplo.com'
on conflict do nothing;
```

3. recarregar a página.

Sem a migração 002, ou sem estar na tabela `admins`, a fila continua invisível e a
aprovação segue pelo painel: **Table Editor → `avaliacoes`**, mudando `status` de
`pendente` para `aprovado`. A view `fila_moderacao` junta tudo que está esperando.

> **Ainda não testado contra um projeto real.** O fluxo de login foi escrito conforme
> a API do Supabase mas nunca rodou de ponta a ponta aqui, porque não há projeto. Se
> algo falhar na primeira vez, o suspeito nº 1 é a *Redirect URL* não cadastrada.

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
