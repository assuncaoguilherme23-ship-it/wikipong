# SMTP próprio e o e-mail em português

Duas coisas que moram na mesma tela do painel e resolvem juntas:

1. **o limite de 2 e-mails por hora**, que impede mais de duas pessoas por hora de
   entrar ou se cadastrar;
2. **o e-mail em inglês**, que hoje é o texto padrão do Supabase — num site cuja
   identidade inteira é ser em português.

Nada de código muda. É tudo painel e DNS.

---

## Parte 1 — Por que o provedor nativo não serve

O e-mail que o Supabase manda de graça sai de um servidor compartilhado por todos os
projetos gratuitos da plataforma. Por isso ele é limitado a algo em torno de **2
mensagens por hora**, e a própria Supabase diz que ele é para teste, não para
produção.

Enquanto só você entrava, isso era irrelevante. Com cadastro aberto, a terceira
pessoa que tentar entrar na mesma hora simplesmente não recebe nada — e, pior, não
descobre por quê.

Um servidor próprio também resolve outra coisa que não aparece de imediato: e-mail
saindo de um domínio verificado como `wikipong.com` cai muito menos em spam do que
e-mail saindo de um remetente compartilhado.

---

## Parte 2 — Criar a conta no Resend (10 min)

Existem várias opções (Resend, SendGrid, Amazon SES, Brevo). O **Resend** é o mais
simples de configurar e o plano gratuito é folgado para o tamanho do WikiPong.

1. Crie conta em **[resend.com](https://resend.com)**.
2. Vá em **Domains** → **Add Domain** e digite `wikipong.com`.
3. O Resend mostra uma lista de **registros DNS** para você cadastrar. São em geral
   três tipos:
   - um **MX** (por onde as respostas voltam),
   - um **TXT de SPF** (diz que o Resend tem permissão de enviar no seu nome),
   - um **TXT de DKIM** (assina as mensagens, para provar que não foram forjadas).

> **Copie os valores da tela do Resend, não daqui.** Eles são únicos por domínio e
> mudam de conta para conta.

---

## Parte 3 — Cadastrar o DNS (varia)

Esta é a única parte que depende de onde o `wikipong.com` está registrado —
Registro.br, GoDaddy, Cloudflare, Hostinger, e por aí. Procure no painel do seu
registrador por **DNS**, **Zona DNS** ou **Gerenciar registros**.

Para cada linha que o Resend pediu, crie um registro com o mesmo **tipo**, **nome** e
**valor**.

Três armadilhas comuns:

- **O nome às vezes já inclui o domínio.** Alguns painéis pedem só `resend._domainkey`
  e outros pedem `resend._domainkey.wikipong.com`. Se der erro de duplicação, é isso.
- **Não crie um segundo SPF.** Se já existir um registro TXT começando com
  `v=spf1`, você precisa **juntar** as duas permissões numa linha só, não criar outra.
  Dois SPF invalidam os dois.
- **Demora.** A propagação costuma levar minutos, mas pode levar horas. O Resend tem
  um botão de *Verify* — se falhar na primeira vez, espere e tente de novo antes de
  mexer em qualquer coisa.

Quando o domínio ficar **Verified** no Resend, siga.

---

## Parte 4 — Pegar a chave e ligar no Supabase (5 min)

1. No Resend, vá em **API Keys** → **Create API Key**. Guarde o valor: ele aparece
   **uma vez só**.
2. No Supabase, vá em **Authentication** → **Emails** (em alguns painéis, *Project
   Settings → Auth*) e procure **SMTP Settings**. Ligue o **Custom SMTP**.
3. Preencha com o que o Resend indicar na seção de SMTP. Os valores costumam ser:

| Campo | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Porta | `465` (ou `587`) |
| Usuário | `resend` |
| Senha | a API key que você acabou de criar |
| Sender email | `contato@wikipong.com` (qualquer coisa `@` domínio verificado) |
| Sender name | `WikiPong` |

> **Confirme host, porta e usuário na tela do próprio Resend.** Estes valores são os
> usuais, mas provedores mudam configuração de tempos em tempos e a fonte da verdade
> é a documentação deles, não este arquivo.

4. Ainda no Supabase, procure **Rate Limits** dentro de Authentication. O limite de
   envio de e-mail é uma configuração **separada** do provedor: trocar o SMTP não
   levanta o teto sozinho. Suba para um número que faça sentido (algumas centenas por
   hora é bastante).

---

## Parte 5 — O e-mail em português (10 min)

Hoje quem pede um link recebe o texto padrão do Supabase, em inglês, com assunto tipo
*"Magic Link"*. Num site que se apresenta como enciclopédia em português, isso destoa
logo no primeiro contato.

Em **Authentication** → **Emails**, escolha o template **Magic Link**. Assunto:

```
Seu link de entrada no WikiPong
```

E o corpo:

```html
<h2>Entrar no WikiPong</h2>

<p>Clique no botão abaixo para entrar. O link vale por pouco tempo e só funciona uma vez.</p>

<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#157A4F;color:#ffffff;
            padding:12px 20px;border-radius:9px;text-decoration:none;
            font-family:system-ui,sans-serif;font-weight:600">
    Entrar no WikiPong
  </a>
</p>

<p style="color:#49514A;font-family:system-ui,sans-serif;font-size:14px">
  Se você não pediu este link, pode ignorar esta mensagem — ninguém entra na sua
  conta sem clicar nele.
</p>
```

Três coisas de propósito neste texto:

- **`{{ .ConfirmationURL }}` é a variável que o Supabase substitui pelo link.** Se
  ela sumir, o e-mail chega sem link nenhum. É o único trecho que não pode ser
  reescrito.
- **A última frase existe para quem NÃO pediu o link.** Um e-mail de login que chega
  sem ter sido pedido assusta; dizer o que fazer acalma e é o comportamento correto.
- **A cor `#157A4F` é o acento escuro do WikiPong.** Branco sobre ele passa AA — a
  mesma regra que vale nos botões do site.

Se houver template de **Confirm signup**, vale traduzir também, com a mesma cara.

---

## Parte 6 — Testar

1. Abra `/comunidade/perfil/` numa **janela anônima** (para não usar a sessão que
   você já tem).
2. Peça um link com **outro e-mail seu**, se tiver.
3. Confira três coisas na mensagem que chegar:
   - veio de `@wikipong.com`, e não de um remetente do Supabase;
   - está em português;
   - o botão leva de volta ao site e entra.
4. Peça **três links seguidos**. Antes, o terceiro falharia. Agora deve passar.

---

## Se algo der errado

| O que você vê | Provável causa |
|---|---|
| O Resend não verifica o domínio | DNS ainda propagando, ou o nome do registro veio duplicado com o domínio |
| E-mail cai no spam | Falta o DKIM, ou existe mais de um registro SPF no domínio |
| Continua limitado a poucos envios | O *Rate Limit* do Supabase é separado do SMTP e não subiu junto |
| O e-mail chega sem link | A variável `{{ .ConfirmationURL }}` foi apagada do template |
| Erro de autenticação no SMTP | A senha é a **API key** do Resend, não a senha da sua conta |

---

## Ressalva

Como o resto deste guia, nada aqui foi executado contra uma conta real — foi escrito
a partir da documentação das ferramentas. Nomes de menu e valores de configuração
mudam com o tempo, e a fonte da verdade é sempre a tela que está na sua frente.

Se travar, me diga **em qual parte** e **o que a tela mostrou**.
