# Cadastro com duas portas, e o perfil como espaço da pessoa

**Data:** 2026-08-15 · **Decidido por:** Guilherme (fundador) · **Estado:** portas e recuperação construídas (2026-08-15); refino visual do perfil pendente — ver §6

---

## 1. O que muda, e o que isso reverte

O fundador pediu: **uma tela de perfil mais trabalhada, um espaço que a pessoa chame de seu — e, para obtê-lo, ela passa por uma tela de cadastro.**

Isso **reverte** uma decisão tomada no desenho do perfil público (spec de 2026-08-11, seção 3). Naquele momento eu argumentei contra o formulário de cadastro: o login por link no e-mail já cria a conta, e pedir "escolha um apelido" criaria uma porteira que não existia. O fundador concordou na época e escolheu o apelido gerado sozinho justamente para não ter esse passo.

Ele mudou de ideia. O registro fica porque a razão original continua verdadeira — a porteira **existe** e é o custo consciente desta decisão. O que compra esse custo é o outro lado: um perfil em que a pessoa investiu antes de usar o site é um perfil que ela trata como dela.

## 2. A escolha: as duas portas

Das três opções apresentadas, o fundador escolheu **manter as duas formas de entrar**:

| Porta | Estado |
|---|---|
| Link no e-mail (Supabase OTP) | **Já existe** (`src/logica/sessao.ts`). Continua funcionando, sem quebrar para quem já usa. |
| Criar conta com e-mail e senha | **A construir.** |

E, por qualquer das duas, **quem entra pela primeira vez sem perfil passa pela tela de boas-vindas** antes de chegar ao site.

**O custo, declarado:** dois caminhos de autenticação para manter, testar e dar suporte; o dobro de estados de erro; e a tela de "esqueci minha senha", que só existe por causa da porta nova.

## 3. As três peças

### 3.1 A porta com senha

- `signUp` e `signInWithPassword` do Supabase Auth, ao lado do OTP que já existe.
- Fluxo de recuperação de senha (é obrigatório: sem ele, senha esquecida vira conta perdida).
- Confirmação de e-mail — conferir o que o projeto já configurou em `supabase/SMTP-E-EMAILS.md` antes de escrever qualquer coisa.
- **Nada de política de senha inventada.** Usar o que o Supabase já impõe e dizer na tela qual é a regra, em vez de escrever uma régua própria.

### 3.2 A tela de boas-vindas

Em passos, na primeira entrada de quem não tem perfil: como você assina · estilo e nível · mão e empunhadura · sua raquete.

Regras que não podem escapar:

- **Dá para pular e voltar depois.** Boas-vindas que prendem viram desistência, e o site inteiro já funciona sem perfil.
- O apelido **continua sendo gerado sozinho** a partir do nome (`src/logica/apelido.ts`) e continua congelado no primeiro salvamento. A tela de cadastro não é motivo para pedir apelido à mão: o custo daquilo (disponibilidade, nomes reservados, disputa por nome) não mudou.
- Cada passo grava o que já foi preenchido. Ninguém perde três telas porque a quarta falhou.

### 3.3 O perfil como espaço da pessoa

O que existe hoje (`/comunidade/jogador/?p=`) é correto e honesto, mas é uma **ficha**. O pedido é que seja um **espaço**. Isso é trabalho de design, não de dados — e é onde a `impeccable` entra, com o registro `product` do PRODUCT.md.

O que **não** pode aparecer, por ser anti-referência declarada do projeto: gradiente decorativo, glassmorphism, kicker em toda seção, hero-metric, grid de cards idênticos. Já foram expulsos numa passada anterior e não voltam.

## 4. O que continua valendo e não se discute

- **A RLS não afrouxa.** A porta nova muda como a pessoa entra, não o que ela pode ler ou escrever. As políticas das migrações 001 a 015 ficam como estão.
- **O motivo da estante continua passando por `motivoVisivel`**, e a fila de moderação continua sendo o que separa fato de prosa (D-14).
- **Nenhuma senha, token ou chave entra no repositório.** A chave anônima é a única que o bundle carrega, e toda a segurança vive na RLS.
- As invariantes de `testes/rodar.ts` continuam valendo e a suíte tem que seguir verde (537 asserções hoje).

## 5. Por onde começar

1. Ler `supabase/SMTP-E-EMAILS.md` e o `src/logica/sessao.ts` inteiros antes de tocar em autenticação.
2. Construir a porta com senha e a recuperação, com o OTP intacto ao lado.
3. Construir as boas-vindas em passos, gravando a cada passo.
4. Só então o refino visual do perfil, com `/impeccable polish`.

A ordem importa: refinar o visual antes de a tela de boas-vindas existir seria polir uma superfície que vai mudar de forma.

---

## 6. O que foi construído (2026-08-15)

| Peça | Onde | Estado |
|---|---|---|
| Porta com senha (criar + entrar) | `/comunidade/entrar/` | ✅ |
| Recuperação de senha | `/comunidade/nova-senha/` | ✅ |
| Trocar senha estando dentro | mesma tela, link no perfil | ✅ |
| Boas-vindas em passos | `/comunidade/boas-vindas/` | ✅ (sessão anterior) |
| Porteira na primeira entrada | dentro da tela de entrar | ✅ |
| Configuração de painel | `supabase/SENHA-E-RECUPERACAO.md` | ⏳ depende do fundador |
| Refino visual do perfil | `/impeccable polish` | ⏳ próximo |

### Três decisões que o spec não cobria

**1. A porteira mora na tela de entrar, não no site inteiro.**
O spec diz "quem entra pela primeira vez sem perfil passa pela tela de boas-vindas
antes de chegar ao site". Um porteiro global — que interceptasse qualquer página —
apanharia também quem entrou pelo formulário embutido na ficha de uma borracha,
sequestrando a pessoa no meio de outra tarefa. A porteira roda em
`/comunidade/entrar/`, que é por onde passa quem foi *se cadastrar*, e a tela de
entrar é para onde os links de e-mail voltam. Quem entra de dentro de uma ficha
continua na ficha, que é o que ela queria.

**2. O formulário embutido (`componentes/Login.tsx`) continua com UMA porta.**
Quem esbarra nele não veio se cadastrar — veio avaliar uma borracha. Nesse
momento, escolher entre senha e link é uma decisão a mais no caminho de outra
coisa. Ele oferece o link, e leva à tela inteira com `?volta=` para quem quiser
senha.

**3. O `?volta=` é filtrado por `caminhoInterno`, com teste.**
Um `?volta=` sem filtro transforma a tela de login num redirecionador aberto: um
login de verdade, no domínio de verdade, que cospe a pessoa noutro site. Duas
formas disfarçadas passam por "começa com barra" — `//alvo` e `/\alvo` (o
navegador normaliza a contrabarra). A função está em `src/logica/sessao.ts` com
as duas cobertas por asserção; tirar a guarda derruba exatamente dois testes.

---

## 7. Segunda rodada — "não gostei do layout" (2026-08-15, mesmo dia)

O fundador olhou e recusou: **"Precisa ser mais trabalhada, deixar o espaço como único do usuário, e é preciso de cadastro pra ele ter esse perfil completo e detalhado."** Perguntado, ele escolheu **as duas telas** e **campos novos + apresentação rica, com quem não entra vendo pouco**.

### As duas telas viraram uma só coisa vista de dois lados

`componentes/CartaoMesaJogador` passou a ser o topo das duas. Não é "dois blocos parecidos": é o mesmo componente, com os mesmos dados, pintando **ao vivo** enquanto se digita na tela de editar. Antes havia um "crachá" no meio do formulário que *imitava* a página pública — e imitação diverge na primeira mexida, o que faria "é assim que você aparece" virar mentira sem ninguém notar.

Duas funções puras (`tracosDoPerfil`, `contextoDoPerfil`) garantem que as duas linhas do cartão sejam idênticas nas duas telas, com asserção em cima.

### O formulário deixou de ser um paredão

Oito campos numa grade só viraram **três grupos com nome** — quem você é · como você joga · onde você joga — cada um com uma frase dizendo pra que serve. Grupo com nome é uma pergunta de cada vez, mesmo com tudo na tela. Ao lado, um **trilho** lista o que ainda dá pra contar e **o que cada coisa faz aparecer**.

**Sem porcentagem, e isso é decisão, não esquecimento.** Barra de "perfil 60% completo" faz a pessoa preencher pra calar o medidor, e dado ruim é pior que dado faltando (D-16). A lista some conforme ela conta.

### Quatro campos novos, e o critério de escolha

Migração **016**. O critério foi: pergunta curta, resposta que a pessoa sabe de cabeça, e que **muda como se lê o resto do perfil**.

| Campo | Por que ele muda a leitura |
|---|---|
| `joga_desde` | "rápida demais" de quem joga há 1 ano e de quem joga há 20 são duas frases diferentes |
| `frequencia` | quem joga todo dia gasta uma borracha em 3 meses; quem joga aos sábados leva 2 anos — e os dois dizem "durou pouco" |
| `clube` | o único campo do perfil que liga uma pessoa a outra |
| `bola` | detalhe que só mesatenista pergunta, e que muda o toque |

Nenhuma política nova: as policies de `perfis` valem por **linha**, e coluna nova entra coberta.

### E o que ficou detalhado sem perguntar nada

`src/logica/retrato-do-jogador.ts` — derivado do que já existia: anos de raquete, **a nota que a pessoa costuma dar** (só a partir do mesmo `PISO_PARA_MEDIA` que o site usa pra material — média de duas notas engana mais que informa), as marcas que passaram pela mão dela, e a peça que está na raquete há mais tempo.

### A linha entre local e com conta é factual, não comercial

- **Nome · estilo · nível · raquete** funcionam sem conta: preenchem sozinhos a próxima avaliação e alimentam o montador. Guardar no navegador **serve pra alguma coisa**.
- **Todo o resto** só existe pra ser lido por outra pessoa. Sem conta não há página onde alguém leia — o endereço público nasce do apelido, que nasce da conta. Guardar "meu clube é a FitPong" num navegador onde ninguém vai ver seria fingir que algo foi feito.

Essa frase está na tela, com essas palavras. Não é lista de vantagem inventada.

### Um silêncio que eu ia criar e fechei

`gravar()` do perfil não olhava `res.ok` e terminava em `.catch(() => {})`. Com colunas novas no código e migração não rodada no banco, o sintoma seria **o pior possível para um formulário: aceitar tudo e não guardar nada**. Agora ela lança, a tela mostra o motivo em português logo abaixo do cartão, e o caso mais provável (`PGRST204`) tem frase própria mandando rodar a migração. As boas-vindas já chamavam `gravar` dentro de `try/catch` esperando esse comportamento.

**Suíte: 616 asserções** (eram 537 no começo do dia).

### O que continua verdade

- RLS intocada: nenhuma migração foi alterada. A porta nova muda como a pessoa
  entra, não o que ela pode ler ou escrever.
- Nenhuma senha, token ou chave entrou no repositório. `sessao.ts` tem asserção
  proibindo `console.*` — senha e token não podem vazar nem pro console.
- Nenhuma política de senha inventada: o número que a tela mostra ao recusar vem
  da mensagem do servidor.
- Suíte verde: **582 asserções** (eram 537).
