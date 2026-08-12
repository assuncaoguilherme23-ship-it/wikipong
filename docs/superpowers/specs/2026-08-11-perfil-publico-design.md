# Perfil público do jogador — desenho

**Data:** 2026-08-11 · **Decidido com:** Guilherme (fundador) · **Estado:** aprovado, aguardando plano

---

## 1. O problema

O site já tem conta e já tem perfil — só que ninguém consegue ver o de ninguém.

O que existe hoje:

- **Login sem senha**, por link no e-mail (`src/logica/sessao.ts`, Supabase OTP). Quem entra já tem conta; não existe formulário de cadastro, e isso é proposital.
- **`/comunidade/perfil/`** — nome, estilo, nível, "meu equipamento" (lâmina + FH + BH, reusando a `Montagem` do `/montar`) e "minhas avaliações". A tela tem um crachá de prévia com o rótulo *"é assim que você aparece"*.
- **`perfis`** no Supabase, com leitura pública (`using (true)`) e escrita só do dono.
- `avaliacoes`, `topicos` e `respostas` já carregam `usuario_id`, e a migração 008 já indexou as três por esse campo.

O buraco: **o crachá promete uma aparição que não acontece em lugar nenhum.** Aquela tela é, na prática, uma página de configurações. E a atividade que ela mostra é só de avaliações — discussões, respostas e pedidos de pauta ficam de fora, embora estejam todos no banco amarrados ao mesmo `usuario_id`.

Sem perfil visível, uma avaliação é uma frase sem dono. Quem lê "a Rakza 7 gira muito" não tem como saber se quem escreveu joga há dois meses ou há vinte anos, com que raquete, e se já usou alguma outra borracha na vida. É esse contexto que faz uma avaliação valer alguma coisa — e é exatamente o que o D-11 e o D-14 pedem: separar o fato de quem o afirma, e deixar quem lê julgar.

## 2. Decisões já tomadas

| # | Decisão | Quem |
|---|---|---|
| D-a | O perfil é **público**, com página própria. A tela atual continua sendo a de edição. | Fundador |
| D-b | O endereço usa **apelido derivado do nome + sufixo curto**, gerado sozinho. Sem passo novo no login. | Fundador |
| D-c | Entram na v1 as quatro extras: estante, comparar com a minha raquete, procedência de quem avalia, "resolveu N dúvidas". | Fundador |
| D-d | Nada de seguidores, curtidas ou pontuação. Placar muda o que as pessoas escrevem. | Proposto e aceito |

## 3. A URL, e por que não é bonita

**Endereço:** `/comunidade/jogador/?p=<apelido>`

O site é export estático (D-17, `output: 'export'`). Rota dinâmica em export só emite os caminhos que `generateStaticParams` devolve **no momento do build** — é assim que `/materiais/[id]/` funciona, porque a lista de materiais é conhecida e versionada no repositório.

Perfis nascem depois do build. `/comunidade/jogador/guilherme-a7f/` só existiria para quem já existisse na última publicação, e todo mundo que se cadastrasse depois cairia em 404 até o próximo deploy. Uma seção da comunidade que só funciona para quem chegou antes do último `git push` não é uma seção da comunidade.

Então: **uma página estática só, que lê o apelido da query.** É o mesmo padrão do `/catalogo`, e está de acordo com o D-12 — estado navegável vive na URL.

**O que se perde:** o perfil não é pré-renderizado, então não entra em busca do Google. Para perfil isso pesa mais a favor que contra.

### Geração do apelido

`slug(nome)` + `-` + os 4 primeiros dígitos hexadecimais do `usuario_id`.

- `slug`: minúsculas, acentos removidos por NFD, tudo que não é letra ou número vira `-`, hífens colapsados e aparados, cortado em 32 caracteres.
- Nome que vira slug vazio (só símbolos) usa `jogador`.
- Exemplo: `Guilherme Assunção` → `guilherme-assuncao-a7f3`.

**Gerado uma vez, no primeiro salvamento, e nunca mais.** Trocar de nome não move o endereço — é isso que faz um link colado no WhatsApp continuar respondendo daqui a um ano. A página mostra sempre o nome atual; só a URL é congelada.

Colisão exige mesmo slug **e** mesmos 4 hex. A coluna é `unique`; se o banco recusar, o cliente tenta de novo com 6 dígitos, depois 8. Sem laço infinito: três tentativas e o erro sobe.

## 4. Banco

### Migração 014 — `perfis` ganha colunas

| Coluna | Tipo | Observação |
|---|---|---|
| `apelido` | `text unique` | Gerado uma vez. Índice único é o que garante o endereço. |
| `mao` | `text check in ('destro','canhoto')` | Muda a recomendação inteira e hoje não existe no site. |
| `empunhadura` | `text check in ('classica','caneta-chinesa','caneta-japonesa')` | Idem. |
| `cidade` | `text` | Opcional. |
| `uf` | `text check char_length = 2` | Opcional. |
| `procuro` | `text check <= 120` | "O que eu procuro agora." Uma linha. |

E-mail **não** entra e nunca entrou: `perfis` não tem essa coluna, e é por isso que a leitura pública dela é segura.

### Migração 015 — `estante` e `estante_motivos`

Duas tabelas, e a separação é o ponto:

```
estante           -- FATO: leitura pública direta
  id, usuario_id, material_id, de (date), ate (date, nulo = usa hoje), criado_em

estante_motivos   -- PROSA: espera gente
  estante_id (pk, fk), usuario_id, texto, status, criado_em
```

**Por que duas e não uma coluna a mais.** A RLS do Postgres filtra **linhas, não colunas** — é a mesma pedra em que este projeto já bateu, e o motivo de `marcar_resposta_util` ser uma função em vez de uma política de UPDATE (migração 010). Com uma tabela só, esconder o motivo pendente sem esconder o material exigiria ou `grant` por coluna mais funções `security definer` para o dono e para o admin lerem o que é deles, ou uma view. Duas tabelas resolvem o mesmo com RLS pura, sem mecanismo novo.

**A regra que isso implementa é o D-14, literalmente: fato se publica sozinho, prosa espera gente.**

- Material e período são verificáveis e entram na hora.
- O motivo é texto livre num lugar público. Nasce `pendente`, aparece para terceiros só depois de aprovado.
- **O dono vê o próprio motivo o tempo todo**, aprovado ou não, para nunca ter a sensação de que o que escreveu sumiu.

Políticas:

| Tabela | anon | authenticated |
|---|---|---|
| `estante` | `select using (true)` | `select using (true)`; insert/update/delete só `usuario_id = auth.uid()` |
| `estante_motivos` | `select using (status = 'aprovada')` | `select using (status = 'aprovada' or usuario_id = auth.uid() or eh_admin())`; `insert with check (usuario_id = auth.uid() and status = 'pendente')`; `delete using (usuario_id = auth.uid())`; `update` só `eh_admin()` |

Uma política por papel, sempre com `to` explícito — a lição da migração 007: política sem `to` também se aplica a `anon` e devolve 401.

**Duas armadilhas de coluna, evitadas de propósito.** A RLS filtra linhas, não colunas, então nenhuma política consegue dizer "o dono pode mexer no texto mas não no status":

- No `insert`, o `with check` exige `status = 'pendente'` explicitamente. Sem essa cláusula, o dono publicaria o próprio motivo mandando `status: 'aprovada'` no corpo do POST, e a fila de moderação viraria enfeite.
- O dono **não tem `update`**, só `insert` e `delete`. Editar um motivo é apagar e escrever outro — o que, de quebra, é o comportamento certo: texto reescrito volta para a fila em vez de herdar a aprovação do texto antigo. O `update` fica só com o admin, que é quem muda status.

`texto` tem `check` entre 10 e 280 caracteres. Menos que 10 não é motivo, é ruído; mais que 280 é avaliação, e avaliação tem lugar próprio.

## 5. Módulos puros (`src/logica/`)

Convenção da casa: lógica de negócio sem DOM e sem framework, com tabelas de lookup exportadas de um lugar só.

**`perfil.ts` (existente, estendido)**
- `apelidoDe(nome, usuarioId, tentativa)` — a geração descrita acima, determinística e testável.
- Campos novos no tipo `Perfil` e nos dois repositórios (local e Supabase).
- `MAOS` e `EMPUNHADURAS` como tabelas exportadas, com rótulo em PT-BR.

**`estante.ts` (novo)**
- Tipo `EntradaDeEstante` e `Motivo`.
- `emUsoHoje(e)` — `ate` nulo.
- `ordenarEstante(es)` — em uso primeiro, depois por `de` decrescente. Sem data, vai para o fim: não invento cronologia que a pessoa não deu.
- `validarEntrada(e)` — material existe, `de <= ate`, motivo dentro dos limites.
- Repositórios local e Supabase, mesmo desenho das avaliações.

**`atividade.ts` (novo)**
- Tipo `Atividade` discriminado por `tipo: 'avaliacao' | 'topico' | 'resposta'`.
- `linhaDoTempo(avaliacoes, topicos, respostas)` — mistura e ordena por data, mais recente primeiro.
- Cada item carrega o mínimo para se desenhar: o que é, para onde aponta, quando foi.
- **Pedidos de pauta ficam de fora da linha do tempo pública.** Pedido é um recado para a casa, não uma contribuição pública, e o autor pode nem querer que apareça no perfil dele.

**`procedencia-do-avaliador.ts` (novo)**
- `procedenciaDe(avaliacoes)` → `{ quantas, tempoMedioDeUso, materiaisDistintos, ladosCobertos }`.
- Não devolve selo nem nota. Devolve os números, e quem lê julga — é a Regra da Voz de Dados aplicada a gente em vez de a material.

**`discussoes.ts` (existente)**
- `resolveuQuantas(topicos, usuarioId)` — conta `respostaUtil` que aponta para resposta dessa pessoa. O dado já está no banco desde a migração 010.

## 6. Telas

### `/comunidade/perfil/` — edição (a que já existe)

Ganha: mão, empunhadura, cidade/UF, "o que eu procuro", a estante (adicionar, editar, encerrar uma entrada) e um link **"ver como os outros veem"** apontando para o próprio perfil público. O crachá de prévia deixa de ser promessa e vira link.

### `/comunidade/jogador/?p=<apelido>` — pública, só leitura

De cima para baixo:

1. **Cabeçalho** — nome; estilo · nível · mão · empunhadura; cidade; a linha "procuro".
2. **A raquete como retrato** — as três peças com foto, e o radar das características somadas. Reusa `Radar.tsx` e `montagem.ts`. Num site de equipamento, a raquete diz mais que um avatar.
3. **Comparar com a minha** — só aparece para quem está logado **e** tem raquete montada: o radar da pessoa com o seu sobreposto, igual ao `/comparar`. Fora dessas condições o bloco não existe (não é um estado vazio, é ausência).
4. **Procedência** — a linha de números das avaliações.
5. **Estante** — a linha do tempo do equipamento, com os motivos aprovados.
6. **Atividade** — avaliações, tópicos e respostas misturados por data.

**O nome vira link** em toda avaliação e discussão, apontando para cá. Isso exige resolver `usuario_id → apelido` em lote nas listagens: uma consulta a mais por tela, `perfis?usuario_id=in.(...)&select=usuario_id,apelido,nome`.

## 7. Vazios, erros e acessibilidade

- **Bloco sem dado desaparece inteiro.** Nada de "nenhum item ainda". Perfil novo mostra o pouco que tem, não uma lista das suas ausências.
- **Apelido inexistente** — "esse jogador não existe", com caminho de volta para a comunidade. Não é erro; é endereço velho ou digitado errado.
- **Sem backend** — a mesma mensagem que as outras telas da comunidade já dão.
- **Falha de rede** não pode virar tela branca: o que já carregou fica.
- D-18 continua valendo: contraste conferido nos **dois** temas, foco visível, navegação por teclado, `prefers-reduced-motion` no draw-in do radar (o `Radar.tsx` já faz).
- O radar é `aria-hidden`; a alternativa acessível é a tabela de características, como no `/comparar`.

## 8. Moderação

Quinta aba, no mesmo padrão das quatro que já existem: lista os motivos de estante pendentes, com o material e a pessoa ao lado, e os botões de aprovar e descartar.

**Custo honesto:** é mais uma fila para o fundador. Na prática deve ficar quase sempre vazia, porque a maioria vai registrar só o material e o período.

`nome` e `procuro` **não** passam por moderação. Não é descuido: `nome` já é público e não moderado hoje, e criar uma porteira só para o `procuro` não fecharia buraco nenhum. Os dois ganham limite de tamanho. Se um dia isso virar problema, o remédio é uma forma de denunciar perfil — e aí é outro spec.

## 9. Testes

`testes/rodar.ts`, no estilo da casa: asserções que quebram de propósito quando o comportamento muda.

- **Apelido** — acento vira ASCII; nome só de símbolos cai em `jogador`; mesmo nome com ids diferentes gera apelidos diferentes; **trocar o nome não muda o apelido** (a que protege os links).
- **Estante** — em uso vem primeiro; sem data vai para o fim; `de` depois de `ate` é recusado.
- **Motivo pendente não vaza** — a asserção mais importante das quatro: um motivo `pendente` não pode aparecer na leitura de terceiro.
- **Atividade** — mistura as três fontes e ordena por data; lista vazia devolve lista vazia, não quebra.
- **Procedência** — os números batem com um conjunto de avaliações montado à mão.
- **Pedido de pauta não entra** na linha do tempo pública.

## 10. Fora de escopo (YAGNI)

Seguidores · curtidas · pontos e níveis de reputação · mensagem direta · foto de avatar (a raquete é o retrato) · perfil desligável (decidido: público é público) · troca de apelido · denúncia de perfil · pedidos de pauta na linha do tempo.
