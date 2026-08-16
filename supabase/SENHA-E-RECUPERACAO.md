# A porta com senha — o que falta no painel

O código das duas portas já está no site:

| Tela | O que faz |
|---|---|
| `/comunidade/entrar/` | entrar com senha · criar conta · pedir link no e-mail · esqueci minha senha |
| `/comunidade/nova-senha/` | destino do link de recuperação, e também "trocar minha senha" |

**Nada disso funciona até três coisas serem feitas no painel do Supabase.** Não é
código: é configuração, e as três falham de formas diferentes e igualmente
silenciosas.

---

## Parte 1 — As URLs permitidas (obrigatório, 2 min)

**Se você pular esta parte, o e-mail é enviado normalmente e o link devolve a
pessoa na home.** Sem erro, sem aviso, sem nada explicando por quê — foi
exatamente o que aconteceu na primeira versão do login por link, e está anotado
em `src/logica/sessao.ts`.

Vá em **Authentication** → **URL Configuration** → **Redirect URLs** e acrescente:

```
https://wikipong.com/comunidade/entrar/
https://wikipong.com/comunidade/nova-senha/
```

Se você testa em `localhost`, acrescente as mesmas duas com
`http://localhost:3000`.

> O Supabase aceita curinga (`https://wikipong.com/**`). Ele é mais confortável e
> menos seguro: qualquer caminho do site vira destino válido de link de
> autenticação. Como o site tem só dois destinos, listar os dois custa nada.

---

## Parte 2 — Confirmação de e-mail: decidir, não deixar no padrão

Em **Authentication** → **Providers** → **Email** existe **Confirm email**. As duas
posições funcionam, e o site trata as duas — mas elas produzem experiências
diferentes, e vale escolher de propósito:

| | Ligado (padrão) | Desligado |
|---|---|---|
| Depois de "Criar minha conta" | "olhe sua caixa", e a senha só entra depois de confirmar | entra na hora, direto pras boas-vindas |
| Custo | um passo a mais, e depende do e-mail chegar | qualquer e-mail digitado errado vira conta órfã |
| E-mail alheio | ninguém cria conta com o seu e-mail | qualquer um pode |

**Recomendação: deixar ligado.** O site tem SMTP próprio (ver
`SMTP-E-EMAILS.md`), então o e-mail chega rápido, e conta criada com o e-mail de
outra pessoa é o tipo de problema que só aparece quando já é tarde.

Com ele ligado, o Supabase faz mais uma coisa de graça e que vale saber: quando
alguém tenta criar conta com um e-mail **que já tem conta**, ele responde
"sucesso" com um usuário falso e manda um aviso pra caixa da pessoa. Isso existe
para não entregar quem tem conta aqui, e o site **não desmascara isso** — a tela
diz "olhe seu e-mail", que é verdade nos dois casos.

---

## Parte 3 — Os e-mails em português (10 min)

O `SMTP-E-EMAILS.md` já traduziu o template **Magic Link**. A porta com senha usa
outros dois, e eles continuam em inglês até serem traduzidos.

Em **Authentication** → **Emails**:

### Confirm signup

Assunto:

```
Confirme seu e-mail na WikiPong
```

Corpo:

```html
<h2>Falta um clique</h2>

<p>Você criou uma conta na WikiPong. Clique no botão abaixo para confirmar que
este e-mail é seu — depois disso a sua senha já entra.</p>

<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#157A4F;color:#ffffff;
            padding:12px 20px;border-radius:9px;text-decoration:none;
            font-family:system-ui,sans-serif;font-weight:600">
    Confirmar meu e-mail
  </a>
</p>

<p style="color:#49514A;font-family:system-ui,sans-serif;font-size:14px">
  Se não foi você quem se cadastrou, pode ignorar esta mensagem — sem este
  clique, a conta não é usada.
</p>
```

### Reset password

Assunto:

```
Definir uma senha nova na WikiPong
```

Corpo:

```html
<h2>Senha nova</h2>

<p>Alguém pediu para trocar a senha desta conta na WikiPong. Se foi você, clique
no botão abaixo. O link vale por pouco tempo e só funciona uma vez.</p>

<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#157A4F;color:#ffffff;
            padding:12px 20px;border-radius:9px;text-decoration:none;
            font-family:system-ui,sans-serif;font-weight:600">
    Escolher senha nova
  </a>
</p>

<p style="color:#49514A;font-family:system-ui,sans-serif;font-size:14px">
  Se não foi você, pode ignorar: sua senha continua a mesma enquanto ninguém
  clicar neste link.
</p>
```

Duas coisas valem para os dois textos, pelos mesmos motivos do Magic Link:

- **`{{ .ConfirmationURL }}` é o único trecho que não pode ser reescrito.** Sem
  ela, o e-mail chega sem link nenhum.
- **A última frase é para quem NÃO pediu.** E-mail de conta que chega sem ter
  sido pedido assusta; dizer o que fazer acalma.

---

## Parte 4 — A regra da senha

Fica em **Authentication** → **Policies** (em alguns painéis, *Providers →
Email → Password*). O padrão do Supabase é **6 caracteres, sem outra
exigência**.

**O site não inventa regra própria** — decisão registrada no spec de 2026-08-15.
Ele só evita uma ida à rede para o caso óbvio (`SENHA_MINIMA` em
`src/logica/sessao.ts`) e, quando o servidor recusa, mostra **o número que o
servidor disse**. Ou seja: se você subir o mínimo para 8 no painel, a tela passa
a dizer 8 sozinha, na hora da recusa.

O que **não** acompanha automaticamente é a frase que aparece **antes** de
digitar ("Pelo menos 6 caracteres…"), em `entrar-cliente.tsx` e
`nova-senha-cliente.tsx`. Se mudar a regra no painel, mude esse número lá — são
dois lugares.

> Exigir símbolo e maiúscula é tentador e é contraproducente: produz senha curta
> e cheia de truque, que a pessoa esquece e anota num papel. Comprimento é o que
> importa.

---

## Parte 5 — Testar (o que quebra, quebra aqui)

Numa **janela anônima**, para não usar a sessão que você já tem:

1. **Criar conta.** `/comunidade/entrar/?modo=criar`, e-mail de verdade, senha
   qualquer com 6+ caracteres.
   - Com *Confirm email* ligado: a tela deve dizer "olhe a sua caixa". O e-mail
     chega em português, do `@wikipong.com`, e o link **volta pra tela de
     entrar** — não pra home. Se voltar pra home, é a Parte 1.
   - Depois de confirmar, você deve cair nas **boas-vindas**, não no perfil.
     Essa é a porteira.
2. **Errar a senha de propósito.** A frase tem que falar em senha e **não** pode
   dizer se o e-mail existe.
3. **Esqueci minha senha.** O link tem que abrir `/comunidade/nova-senha/` com o
   campo pronto — se abrir dizendo "este link não abre mais", é a Parte 1.
4. **Clicar no mesmo link de recuperação duas vezes.** A segunda tem que dizer
   que o link não vale mais e oferecer pedir outro. É o caminho que mais aparece
   na vida real, porque as pessoas voltam no e-mail.
5. **Entrar com a senha nova.** Fecha o círculo.
6. **Entrar pelo link no e-mail e depois "trocar minha senha"** (no perfil). É
   assim que quem nunca teve senha ganha uma.

---

## Se algo der errado

| O que você vê | Provável causa |
|---|---|
| O link do e-mail devolve na home | Parte 1: a URL não está na lista de permitidas |
| "Este link não abre mais", com link recém-chegado | Parte 1, ou o link já tinha sido clicado antes |
| E-mail em inglês | Parte 3: o template daquele tipo não foi traduzido |
| "Esse e-mail já tem conta" ao criar | é isso mesmo — entre com a senha, ou use "esqueci" |
| "E-mail ou senha não conferem", com a senha certa | a conta foi criada por link e ainda não tem senha: use "esqueci minha senha" |
| Cadastro não sai do "enviando" | cota de e-mail estourada (ver `SMTP-E-EMAILS.md`, Parte 4) |

---

## Ressalva

Como o resto destes guias, **nada aqui foi executado contra uma conta real** — foi
escrito a partir da documentação das ferramentas e do código que está no site.
Nomes de menu mudam com o tempo, e a fonte da verdade é sempre a tela que está na
sua frente.

Se travar, me diga **em qual parte** e **o que a tela mostrou**.
