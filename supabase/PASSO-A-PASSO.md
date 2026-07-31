# Ligar o Supabase — passo a passo

Guia para quem nunca mexeu com backend. **Não há código de servidor pra escrever.**
O que você vai fazer é: criar um projeto, colar dois arquivos SQL, copiar duas
chaves e marcar seu e-mail como moderador.

Leva uns 20 minutos na primeira vez.

> **Sobre os blocos de código deste guia:** as linhas com três crases (```) são
> marcação do documento, não conteúdo. Copie só o que está **entre** elas. Se você
> estiver lendo isto no GitHub ou num visualizador de Markdown, as crases nem
> aparecem — o bloco vira uma caixinha cinza, e aí é só copiar a caixinha inteira.

**Antes de começar, entenda o que muda:** hoje o que você escreve no site fica só
no seu navegador. Depois disso, fica num banco de dados de verdade e todo mundo vê
(depois de você aprovar). É um caminho sem volta fácil — não porque quebre algo,
mas porque a partir daí existe conteúdo de outras pessoas para cuidar.

---

## Parte 1 — Criar o projeto (5 min)

1. Entre em **[supabase.com](https://supabase.com)** e crie uma conta (dá para
   entrar com o GitHub).
2. Clique em **New project**.
3. Preencha:
   - **Name:** `wikipong`
   - **Database Password:** clique em *Generate a password* e **salve num lugar
     seguro**. Você quase nunca vai precisar dela, mas se perder não dá para
     recuperar — só resetar.
   - **Region:** escolha **South America (São Paulo)**. O site é brasileiro; o
     banco perto de quem usa deixa tudo mais rápido.
4. Clique em **Create new project** e espere uns 2 minutos enquanto ele monta.

> **Plano gratuito:** o projeto **pausa sozinho depois de uma semana sem
> ninguém acessar**. Não perde nada — é só clicar em *Restore* no painel. Mas se
> um dia o site aparecer sem avaliações, é o primeiro lugar para olhar.

---

## Parte 2 — Criar as tabelas (5 min)

No menu da esquerda, abra o **SQL Editor** (ícone de terminal).

1. Clique em **New query**.
2. Abra o arquivo **`supabase/001-comunidade.sql`** deste projeto, copie **tudo**
   e cole na caixa.
3. Clique em **Run** (ou `Ctrl+Enter`).
4. Deve aparecer **Success. No rows returned**. É isso mesmo: ele criou coisas, não
   buscou nada.
5. Repita com o arquivo **`supabase/002-login.sql`**.
6. Repita com **`supabase/003-conserta-fila.sql`**.

> **Se você já rodou o `001` antes de 31/07/2026**, o `003` é obrigatório: a
> primeira versão tinha uma falha em que a view `fila_moderacao` deixava qualquer
> pessoa ler o conteúdo ainda não moderado. O painel do Supabase aponta isso
> sozinho, com um alerta vermelho de *Security Definer View*.

> Se der erro no 002 dizendo que algo não existe, você provavelmente pulou o 001.
> A ordem importa.

Para conferir: abra **Table Editor** no menu. Devem estar lá `avaliacoes`,
`topicos`, `respostas`, `perfis` e `admins`, todas vazias.

---

## Parte 3 — Ligar o site no banco (5 min)

São dois valores: o endereço do projeto e a chave pública. Eles ficam em telas
diferentes.

### A chave

**Settings → API Keys**. Pegue a de cima, em **Publishable key** — começa com
`sb_publishable_`. É a que pode ficar à vista no site.

> **Não pegue a Secret key** (`sb_secret_...`), logo abaixo na mesma tela. Ela dá
> poder total sobre o banco e ignora todas as regras de segurança. Se ela entrar no
> site, qualquer visitante pode apagar tudo.

> Se o seu projeto for mais antigo, no lugar de *Publishable* pode aparecer **anon /
> public**, com a chave começando em `eyJ...`. As duas funcionam — o site aceita as
> duas gerações.

### O endereço

Não fica na mesma tela das chaves. Ele é sempre:

```
https://SEU-PROJETO.supabase.co
```

onde `SEU-PROJETO` é aquele código que aparece na barra de endereço do próprio
painel, em `supabase.com/dashboard/project/SEU-PROJETO/...`. Também dá para achar
pronto em **Settings → Data API**.

### Juntando

> **Aqui você SAI do Supabase.** O que vem agora não é para rodar no painel: é um
> arquivo no **seu computador**, dentro da pasta do WikiPong. Colar isto no SQL
> Editor dá `syntax error`, porque não é SQL.

Abra o terminal na pasta do projeto e rode este comando, trocando os dois valores:

```
printf 'NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA-CHAVE
' > .env.local
```

Ou, se preferir criar o arquivo à mão no editor: chame de `.env.local` (com o ponto
na frente), salve na raiz do projeto, e ponha só estas duas linhas:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

**Confira a URL:** ela termina em `.supabase.co` e mais nada. Sem `/rest/v1/`, sem
barra no fim. Se você copiou de algum exemplo da documentação, provavelmente veio com
caminho junto.

> O nome da variável continua `NEXT_PUBLIC_SUPABASE_ANON_KEY` mesmo que a chave se
> chame *publishable*. É o nome interno que o código procura — mudar quebra.

Depois, **pare o servidor** (`Ctrl+C` no terminal onde roda `npm run dev`) e **rode
de novo**.

> **Este último passo é o que mais confunde.** As variáveis só são lidas quando o
> servidor sobe. Se você criar o arquivo com ele rodando, nada muda e parece que não
> funcionou.

Para conferir: abra `/comunidade/perfil/`. O aviso de "prévia" que fala em *só neste
navegador* deve ter sumido das telas de avaliação.

---

## Parte 4 — Ligar o login (5 min)

1. No menu, **Authentication** → **Providers**. Confirme que **Email** está
   ligado. O modo padrão já é o link mágico, que é o que o site usa.
2. **Authentication** → **URL Configuration**. Em **Redirect URLs**, adicione:

```
http://localhost:3000/**
```

E, quando o site estiver publicado, adicione também o endereço real:

```
https://seudominio.com.br/**
```

> **Se o login falhar, o suspeito nº 1 é este passo.** Sem a URL cadastrada, o
> e-mail chega normalmente mas o link joga a pessoa para fora do site.

---

## Parte 5 — Virar moderador (5 min)

1. Com o site rodando, abra **`/comunidade/moderacao/`**.
2. Digite seu e-mail e clique em **Receber link de entrada**.
3. Abra o e-mail e clique no link. Ele traz você de volta ao site já logado.
4. A tela vai dizer que **você entrou mas esta conta não modera**. Está certo:
   entrar não é o mesmo que ter permissão.
5. Volte ao **SQL Editor**, cole isto trocando pelo seu e-mail e rode:

```sql
insert into public.admins (usuario_id)
select id from auth.users where email = 'voce@exemplo.com'
on conflict do nothing;
```

6. Recarregue a página de moderação. Agora a fila aparece.

---

## Parte 6 — Testar de ponta a ponta

Este teste prova que tudo funciona:

1. Abra a ficha de um material qualquer e escreva uma avaliação.
2. **Ela não vai aparecer.** Isso é o certo: tudo entra como *pendente*.
3. Vá em `/comunidade/moderacao/`. Ela está lá, esperando.
4. Clique em **Publicar**.
5. Volte à ficha do material. Agora ela aparece.

Se os cinco passos funcionaram, está tudo ligado.

---

## Quando for publicar o site

O WikiPong é um site **estático**: as duas chaves são gravadas dentro dos
arquivos na hora do `npm run build`. Duas consequências:

- **Trocou as chaves? Precisa rodar `npm run build` de novo.** Só editar o
  `.env.local` não muda o site já gerado.
- **No serviço onde o site fica hospedado** (Vercel, Cloudflare Pages), as duas
  variáveis precisam estar cadastradas lá também, senão o build feito por eles sai
  sem elas e o site volta a gravar só no navegador.

O arquivo `.env.local` **não vai para o Git** (já está no `.gitignore`), e é assim
que tem que ser.

---

## Se algo der errado

| O que você vê | Provável causa |
|---|---|
| O aviso de "prévia" continua aparecendo | Não reiniciou o servidor depois de criar o `.env.local` |
| O e-mail com o link não chega | Olhe o spam. O plano gratuito limita quantos e-mails por hora |
| O link volta para uma página estranha | Redirect URL não cadastrada (Parte 4) |
| "Você entrou, mas esta conta não modera" | Falta rodar o `insert into public.admins` (Parte 5) |
| A avaliação some depois de publicada | É o esperado: ela entra pendente e você aprova na moderação |
| Erro de tabela inexistente no SQL | Rodou o `002` antes do `001` |
| Erro 401 em tudo, mesmo deslogado | Pegou a *Secret key* no lugar da *Publishable* |
| `syntax error at or near "NEXT_PUBLIC..."` | Colou o `.env.local` no SQL Editor. Ele é arquivo do seu computador, não SQL |
| Erro de conexão, ou nada carrega | A URL tem `/rest/v1/` ou barra sobrando. Ela acaba em `.supabase.co` |
| O site parou de mostrar avaliações do nada | Projeto pausado por inatividade — clique em *Restore* |
| Alerta vermelho **Security Definer View** | Rode o `003-conserta-fila.sql` (Parte 2) |

---

## Uma ressalva honesta

Nada disto foi testado contra um projeto Supabase de verdade — foi escrito
seguindo a documentação da ferramenta, mas nunca rodou de ponta a ponta aqui,
porque não existe projeto. Os nomes de menu do painel também mudam de tempos em
tempos.

Se travar em qualquer passo, me diga **em qual passo** e **o que a tela mostrou**.
Com isso dá para consertar rápido.
