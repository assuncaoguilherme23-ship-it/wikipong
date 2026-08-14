# Perfil público do jogador — plano de implementação

> **Para quem executa:** SUB-SKILL OBRIGATÓRIA — use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa por tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** dar a cada pessoa da comunidade uma página pública em `/comunidade/jogador/?p=<apelido>` que mostre quem ela é, que raquete usa, o que já usou antes e o que já contribuiu — e fazer o nome dela virar link em toda avaliação e discussão.

**Arquitetura:** lógica de negócio em módulos puros de `src/logica/` (sem DOM, sem framework), como manda o CLAUDE.md; persistência no Supabase com RLS; telas em React/Next sob `app/comunidade/`. A tela de edição que já existe (`/comunidade/perfil/`) continua sendo o lugar onde se escreve; a tela nova é só leitura.

**Stack:** Next.js App Router com `output: 'export'`, React, TypeScript, Supabase (PostgREST + RLS). Testes em `testes/rodar.ts`.

**Spec:** [`docs/superpowers/specs/2026-08-11-perfil-publico-design.md`](../specs/2026-08-11-perfil-publico-design.md)

---

## Antes de começar — convenções desta base

**Testes.** Não há Jest nem Vitest. Existe um arquivo só, `testes/rodar.ts`, com `afirma(condicao, mensagem)` acumulando em `ok` e `falhas`. Rodar: `npx tsx testes/rodar.ts`. Um teste "falha" quando a mensagem aparece na lista do fim e o processo sai com código 1. Onde este plano diz *"rode e veja falhar"*, é a suíte inteira que roda; o sinal é a mensagem nova aparecer.

**Commits.** Sempre `git commit -F <arquivo>`, nunca `-m` com crase — crase dentro de `-m` vira substituição de comando no bash e come a palavra. Um commit por arquivo lógico. Mensagens em PT-BR, sem acento no corpo do commit (o terminal do Windows come acento em heredoc).

**Idioma.** PT-BR em tudo: nomes de arquivo, funções, variáveis, comentários, commits.

**Sobre as tarefas de tela (11, 12 e 14).** Elas trazem contrato, regras e os trechos que erram fácil — não o componente inteiro linha a linha. É desvio consciente do "código completo em todo passo": as três são casca de React em cima de módulos que as tarefas anteriores já definiram e testaram, e cada uma tem no próprio repositório um irmão quase idêntico para copiar (`PainelNoticias.tsx` para a 14, `catalogo-cliente.tsx` para a leitura de query da 11). Repetir 200 linhas aqui envelheceria mal e divergiria do irmão no primeiro ajuste. **O que não é negociável nessas tarefas está escrito como regra**, e a Task 15 tranca cada uma com uma asserção que lê o código.

**Tema escuro.** Todo CSS novo precisa passar contraste nos dois temas. Para texto acentuado use `--cor-texto-acento`; para fundo de botão, `--cor-acento-escuro`. Acento claro só em preenchimento, borda, anel de foco e wordmark.

---

## Estrutura de arquivos

**Criar:**

| Arquivo | Responsabilidade |
|---|---|
| `src/logica/estante.ts` | Tipo, validação e ordenação do histórico de equipamento + repositórios |
| `src/logica/atividade.ts` | Mistura avaliações, tópicos e respostas numa linha do tempo só |
| `src/logica/procedencia-do-avaliador.ts` | Os números que descrevem quem avalia |
| `src/logica/apelido.ts` | Geração do endereço do perfil |
| `supabase/014-perfil-publico.sql` | Colunas novas em `perfis` |
| `supabase/015-estante.sql` | Tabelas `estante` e `estante_motivos` |
| `app/comunidade/jogador/page.tsx` | Casca estática da tela pública |
| `app/comunidade/jogador/jogador-cliente.tsx` | A tela pública, só leitura |
| `app/comunidade/jogador/jogador.module.css` | Estilos da tela pública |
| `componentes/RaqueteRetrato.tsx` | As três peças + radar somado — usado nas duas telas |
| `componentes/EstanteEditor.tsx` | Adicionar/remover entradas, na tela de edição |
| `app/comunidade/moderacao/PainelEstante.tsx` | Quinta aba de moderação |

**Modificar:**

| Arquivo | O quê |
|---|---|
| `src/logica/perfil.ts` | Campos novos no tipo e nos dois repositórios |
| `src/logica/discussoes.ts` | `resolveuQuantas` |
| `app/comunidade/perfil/perfil-cliente.tsx` | Campos novos, estante, link "ver como os outros veem" |
| `app/comunidade/moderacao/moderacao-cliente.tsx` | Quinta aba |
| `componentes/AvaliacoesMaterial.tsx` | Nome vira link |
| `app/comunidade/discussoes/discussoes-cliente.tsx` | Nome vira link |
| `testes/rodar.ts` | Asserções de tudo acima |

---

## Task 1: O apelido

**Arquivos:**
- Criar: `src/logica/apelido.ts`
- Modificar: `testes/rodar.ts`

- [ ] **Passo 1: escreva o teste que falha**

No fim de `testes/rodar.ts`, antes do `console.log` final:

```ts
/* ───────── apelido: o endereço do perfil ───────── */
const ID_A = '8f3a91c4-2b7e-4d13-9a55-1c0e7b2d4f60';
const ID_B = 'c1d2e3f4-0000-4a1b-8c2d-3e4f5a6b7c80';

afirma(apelidoDe('Guilherme Assunção', ID_A) === 'guilherme-assuncao-8f3a',
  'apelido: acento tem que virar ASCII e o sufixo sai do id');
afirma(apelidoDe('Bruna  Takahashi', ID_B) === 'bruna-takahashi-c1d2',
  'apelido: espaco dobrado nao pode virar hifen dobrado');
afirma(apelidoDe('!!!', ID_A) === 'jogador-8f3a',
  'apelido: nome sem letra nenhuma cai em "jogador"');
afirma(apelidoDe('Ana', ID_A) !== apelidoDe('Ana', ID_B),
  'apelido: mesmo nome com ids diferentes tem que dar apelidos diferentes');
afirma(apelidoDe('Ana', ID_A, 1) === 'ana-8f3a91',
  'apelido: a segunda tentativa alonga o sufixo, para o caso de colisao');
/* A que protege os links colados por ai'. */
afirma(apelidoDe('Guilherme', ID_A).endsWith('-8f3a'),
  'apelido: o sufixo vem do id, nao do nome — trocar de nome nao pode mover o endereco');
```

E o import, junto dos outros do topo:

```ts
import { apelidoDe } from '../src/logica/apelido.js';
```

- [ ] **Passo 2: rode e veja falhar**

Rode: `npx tsx testes/rodar.ts`
Esperado: erro de compilação — `Cannot find module '../src/logica/apelido.js'`.

- [ ] **Passo 3: escreva o módulo**

Crie `src/logica/apelido.ts`:

```ts
/**
 * WikiPong · O endereço do perfil de cada pessoa
 * ------------------------------------------------------------------------------
 * O apelido é gerado UMA VEZ, no primeiro salvamento do perfil, e nunca mais
 * muda. É por isso que o sufixo vem do id do usuário e não do nome: trocar de
 * nome não pode mover o endereço, senão todo link já colado por aí morre.
 *
 * A página mostra sempre o nome atual. Só a URL é congelada.
 */

/** Quantos dígitos do id entram no sufixo, por tentativa. */
const DIGITOS_DO_SUFIXO: readonly number[] = [4, 6, 8];

/** Sem letra nenhuma no nome, o endereço ainda precisa existir. */
const SEM_NOME = 'jogador';

const TAMANHO_MAXIMO_DO_NOME = 32;

/** Minúsculas, sem acento, só letra/número/hífen. */
export function pedaco(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, TAMANHO_MAXIMO_DO_NOME)
    .replace(/-+$/g, '');
}

/**
 * `tentativa` só sobe quando o banco recusa por apelido repetido — o que exige
 * mesmo nome E mesmos dígitos do id. Três tentativas e o erro sobe: laço infinito
 * escondendo um problema de banco é pior que o problema.
 */
export function apelidoDe(nome: string, usuarioId: string, tentativa = 0): string {
  const digitos = DIGITOS_DO_SUFIXO[tentativa] ?? DIGITOS_DO_SUFIXO[DIGITOS_DO_SUFIXO.length - 1];
  const sufixo = usuarioId.replace(/-/g, '').slice(0, digitos);
  const base = pedaco(nome) || SEM_NOME;
  return `${base}-${sufixo}`;
}

export const TENTATIVAS_DE_APELIDO = DIGITOS_DO_SUFIXO.length;
```

- [ ] **Passo 4: rode e veja passar**

Rode: `npx tsx testes/rodar.ts`
Esperado: contagem de asserções sobe em 6 e nenhuma falha.

- [ ] **Passo 5: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(perfil): o apelido que vira endereco do perfil

Gerado uma vez e nunca mais. O sufixo vem do id do usuario e nao do nome:
trocar de nome nao pode mover o endereco, senao todo link ja colado por ai'
morre. A pagina mostra o nome atual; so' a URL e' congelada.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add src/logica/apelido.ts && git commit -F /tmp/c.txt
git add testes/rodar.ts && git commit -F /tmp/c.txt
```

---

## Task 2: Migração 014 — as colunas novas de `perfis`

**Arquivos:**
- Criar: `supabase/014-perfil-publico.sql`

- [ ] **Passo 1: escreva a migração**

```sql
-- WikiPong · 014 · o perfil deixa de ser pagina de configuracoes
-- ----------------------------------------------------------------------------
-- A tabela `perfis` ja' tinha leitura publica (`using (true)`) desde a 001, e
-- nunca teve e-mail — e' por isso que expor essas colunas e' seguro.
--
-- O que entra: o apelido que vira endereco, mao e empunhadura (que mudam a
-- recomendacao inteira e nao existiam no site), cidade/UF opcionais, e a linha
-- "o que eu procuro agora".

alter table public.perfis
  add column if not exists apelido     text,
  add column if not exists mao         text,
  add column if not exists empunhadura text,
  add column if not exists cidade      text,
  add column if not exists uf          text,
  add column if not exists procuro     text;

-- O unique e' o que faz o endereco ser endereco. Parcial porque perfil antigo
-- ainda nao tem apelido, e varios nulos nao podem colidir entre si.
create unique index if not exists perfis_apelido_unico
  on public.perfis (apelido) where apelido is not null;

alter table public.perfis
  drop constraint if exists perfis_mao_valida,
  add constraint perfis_mao_valida
    check (mao is null or mao in ('destro', 'canhoto'));

alter table public.perfis
  drop constraint if exists perfis_empunhadura_valida,
  add constraint perfis_empunhadura_valida
    check (empunhadura is null or empunhadura in ('classica', 'caneta-chinesa', 'caneta-japonesa'));

alter table public.perfis
  drop constraint if exists perfis_uf_valida,
  add constraint perfis_uf_valida
    check (uf is null or char_length(uf) = 2);

-- 120 caracteres: e' uma linha, nao um paragrafo. Quem tem mais que isso pra
-- dizer tem uma discussao pra abrir, nao um campo de perfil pra encher.
alter table public.perfis
  drop constraint if exists perfis_procuro_curto,
  add constraint perfis_procuro_curto
    check (procuro is null or char_length(procuro) <= 120);

comment on column public.perfis.apelido is
  'Endereco publico do perfil (/comunidade/jogador/?p=). Gerado uma vez, nunca muda.';
```

- [ ] **Passo 2: rode no Supabase**

Cole em SQL Editor → Run. Esperado: `Success. No rows returned`.

- [ ] **Passo 3: confira que as colunas existem**

```bash
curl -s "$SUPABASE_URL/rest/v1/perfis?select=apelido,mao,empunhadura,cidade,uf,procuro&limit=1" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```
Esperado: `[]` ou uma linha com os campos nulos — **não** um erro `42703 column does not exist`.

- [ ] **Passo 4: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(perfil): colunas do perfil publico

Apelido (com unique parcial, porque perfil antigo ainda nao tem), mao e
empunhadura, cidade/UF e a linha "o que eu procuro". A `perfis` ja' era de
leitura publica desde a 001 e nunca teve e-mail -- e' por isso que expor isso
e' seguro.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add supabase/014-perfil-publico.sql && git commit -F /tmp/c.txt
```

---

## Task 3: `Perfil` ganha os campos novos

**Arquivos:**
- Modificar: `src/logica/perfil.ts`
- Modificar: `testes/rodar.ts`

- [ ] **Passo 1: escreva o teste que falha**

```ts
/* ───────── perfil: campos novos ───────── */
const perfilCheio: Perfil = {
  ...perfilVazio(),
  nome: 'Guilherme',
  estilo: 'atacante',
  mao: 'canhoto',
  empunhadura: 'caneta-chinesa',
};
afirma(ROTULO_MAO[perfilCheio.mao!] === 'Canhoto',
  'perfil: mao precisa de rotulo legivel');
afirma(ROTULO_EMPUNHADURA['caneta-chinesa'] === 'Caneta chinesa',
  'perfil: empunhadura precisa de rotulo legivel');
afirma(MAOS.length === 2 && EMPUNHADURAS.length === 3,
  'perfil: as tabelas de lookup precisam cobrir todos os valores do check do banco');
```

Import:

```ts
import {
  perfilVazio, temIdentidade, pecasEscolhidas,
  ROTULO_MAO, ROTULO_EMPUNHADURA, MAOS, EMPUNHADURAS, type Perfil,
} from '../src/logica/perfil.js';
```

(substitui o import de `perfil.js` que já existe — junte, não duplique.)

- [ ] **Passo 2: rode e veja falhar**

Rode: `npx tsx testes/rodar.ts`
Esperado: erro de compilação — `ROTULO_MAO` não é exportado.

- [ ] **Passo 3: implemente**

Em `src/logica/perfil.ts`, acima de `export interface Perfil`:

```ts
/* Tabelas de lookup: um lugar só, para poderem ser revistas sem caçar string
   espalhada pela UI. Os valores batem com o check da migração 014. */
export type Mao = 'destro' | 'canhoto';
export type Empunhadura = 'classica' | 'caneta-chinesa' | 'caneta-japonesa';

export const MAOS: readonly Mao[] = ['destro', 'canhoto'];
export const EMPUNHADURAS: readonly Empunhadura[] = ['classica', 'caneta-chinesa', 'caneta-japonesa'];

export const ROTULO_MAO: Readonly<Record<Mao, string>> = {
  destro: 'Destro',
  canhoto: 'Canhoto',
};

export const ROTULO_EMPUNHADURA: Readonly<Record<Empunhadura, string>> = {
  classica: 'Clássica',
  'caneta-chinesa': 'Caneta chinesa',
  'caneta-japonesa': 'Caneta japonesa',
};
```

Dentro de `interface Perfil`, depois de `nivel`:

```ts
  /** Gerado uma vez pelo repositório, na primeira gravação. Nunca muda. */
  apelido?: string;
  mao?: Mao;
  empunhadura?: Empunhadura;
  cidade?: string;
  uf?: string;
  /** Uma linha: "mais controle no backhand". */
  procuro?: string;
```

No `type Linha` de `repositorioPerfilSupabase`:

```ts
  type Linha = {
    nome: string; estilo: string | null; nivel: string | null;
    apelido: string | null; mao: string | null; empunhadura: string | null;
    cidade: string | null; uf: string | null; procuro: string | null;
    equip_lamina: string | null; equip_fh: string | null; equip_bh: string | null;
    atualizado_em: string;
  };
```

No retorno do `ler()`, depois de `nivel`:

```ts
          apelido: l.apelido ?? undefined,
          mao: (l.mao ?? undefined) as Perfil['mao'],
          empunhadura: (l.empunhadura ?? undefined) as Perfil['empunhadura'],
          cidade: l.cidade ?? undefined,
          uf: l.uf ?? undefined,
          procuro: l.procuro ?? undefined,
```

E no `gravar()`, o corpo do POST ganha (note o apelido gerado só quando ainda não existe):

```ts
          apelido: p.apelido ?? apelidoDe(p.nome, usuarioId),
          mao: p.mao ?? null,
          empunhadura: p.empunhadura ?? null,
          cidade: p.cidade?.trim() || null,
          uf: p.uf?.trim().toUpperCase() || null,
          procuro: p.procuro?.trim() || null,
```

com o import no topo do arquivo:

```ts
import { apelidoDe } from './apelido';
```

- [ ] **Passo 4: rode e veja passar**

Rode: `npx tsx testes/rodar.ts`
Esperado: 3 asserções a mais, nenhuma falha.

- [ ] **Passo 5: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(perfil): mao, empunhadura, cidade e a linha "o que eu procuro"

Mao e empunhadura mudam a recomendacao inteira e nao existiam em lugar nenhum
do site. As tabelas de lookup ficam num lugar so', com os valores batendo com
o check da migracao 014.

O apelido e' gerado na gravacao so' quando ainda nao existe: `p.apelido ??
apelidoDe(...)`. E' esse `??` que garante que ele nunca se mova.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add src/logica/perfil.ts && git commit -F /tmp/c.txt
git add testes/rodar.ts && git commit -F /tmp/c.txt
```

---

## Task 4: `estante.ts` — o módulo puro

**Arquivos:**
- Criar: `src/logica/estante.ts`
- Modificar: `testes/rodar.ts`

- [ ] **Passo 1: escreva o teste que falha**

```ts
/* ───────── estante: o que a pessoa usou antes ───────── */
const estanteDeTeste: EntradaDeEstante[] = [
  { id: '1', materialId: 'butterfly-tenergy-05', de: '2023-01-01', ate: '2024-06-01' },
  { id: '2', materialId: 'yasaka-mark-v', de: '2024-06-01' },
  { id: '3', materialId: 'dhs-hurricane-3' },
  { id: '4', materialId: 'xiom-vega-europe', de: '2021-01-01', ate: '2023-01-01' },
];
const ordenada = ordenarEstante(estanteDeTeste);
afirma(ordenada[0].id === '2', 'estante: o que esta em uso hoje vem primeiro');
afirma(ordenada[1].id === '1' && ordenada[2].id === '4',
  'estante: depois do atual, o mais recente primeiro');
afirma(ordenada[3].id === '3',
  'estante: sem data nenhuma vai pro fim — nao invento cronologia que a pessoa nao deu');
afirma(emUsoHoje(estanteDeTeste[1]) && !emUsoHoje(estanteDeTeste[0]),
  'estante: em uso hoje e "ate" vazio');

afirma(problemasDaEntrada({ id: 'x', materialId: 'yasaka-mark-v', de: '2024-01-01', ate: '2023-01-01' }).length === 1,
  'estante: comecar depois de terminar tem que ser recusado');
afirma(problemasDaEntrada({ id: 'x', materialId: 'nao-existe' }).length === 1,
  'estante: material fora do catalogo tem que ser recusado');
afirma(problemasDaEntrada({ id: 'x', materialId: 'yasaka-mark-v', motivo: 'curto' }).length === 1,
  'estante: motivo abaixo do minimo tem que ser recusado');
afirma(problemasDaEntrada({ id: 'x', materialId: 'yasaka-mark-v' }).length === 0,
  'estante: material sozinho, sem data e sem motivo, e' entrada valida');
afirma(problemasDaEntrada({ id: 'x', materialId: 'yasaka-mark-v', motivo: 'a'.repeat(MOTIVO_MAXIMO + 1) }).length === 1,
  'estante: motivo acima do maximo tem que ser recusado');
afirma(MOTIVO_MINIMO === 10 && MOTIVO_MAXIMO === 280,
  'estante: os limites do modulo tem que bater com o check da migracao 015');
```

Import:

```ts
import {
  ordenarEstante, emUsoHoje, problemasDaEntrada,
  MOTIVO_MINIMO, MOTIVO_MAXIMO, type EntradaDeEstante,
} from '../src/logica/estante.js';
```

> Confira que `yasaka-mark-v`, `butterfly-tenergy-05`, `dhs-hurricane-3` e `xiom-vega-europe` existem em `dados/materiais.json`. Se algum não existir, troque pelo id real — `materialPorId` já está importado no arquivo de testes.

- [ ] **Passo 2: rode e veja falhar**

Rode: `npx tsx testes/rodar.ts`
Esperado: `Cannot find module '../src/logica/estante.js'`.

- [ ] **Passo 3: escreva o módulo**

```ts
/**
 * WikiPong · A estante — o que a pessoa usou antes, e por que trocou
 * ------------------------------------------------------------------------------
 * É a coisa mais valiosa que existe em fórum de tênis de mesa e que ninguém
 * guarda direito: "saí da Mark V pra Rakza 7 porque queria mais giro no saque".
 * Sem isto, o perfil mostra só o presente.
 *
 * FATO E PROSA MORAM SEPARADOS (D-14). Material e período são verificáveis e
 * aparecem na hora; o motivo é texto livre num lugar público, nasce pendente e
 * só aparece pra terceiro depois de aprovado. O dono vê o próprio motivo
 * sempre — ninguém precisa sentir que o que escreveu sumiu.
 *
 * No banco isso são duas tabelas (`estante` e `estante_motivos`), porque a RLS
 * do Postgres filtra LINHAS e não colunas. Aqui em cima elas viram um objeto só.
 */
import { materialPorId } from '../../componentes/dados-materiais';

export type StatusMotivo = 'pendente' | 'aprovada' | 'descartada';

export interface EntradaDeEstante {
  id: string;
  materialId: string;
  /** ISO `aaaa-mm-dd`. Ausente = a pessoa não lembra, e tudo bem. */
  de?: string;
  /** Ausente = usa até hoje. */
  ate?: string;
  motivo?: string;
  motivoStatus?: StatusMotivo;
}

export const MOTIVO_MINIMO = 10;
export const MOTIVO_MAXIMO = 280;

export const emUsoHoje = (e: EntradaDeEstante): boolean => !e.ate;

/**
 * Em uso primeiro; depois o mais recente. Sem data nenhuma vai pro fim: colocar
 * no meio seria afirmar uma cronologia que a pessoa não deu.
 */
export function ordenarEstante(es: readonly EntradaDeEstante[]): EntradaDeEstante[] {
  return [...es].sort((a, b) => {
    if (emUsoHoje(a) !== emUsoHoje(b)) return emUsoHoje(a) ? -1 : 1;
    const da = a.ate ?? a.de ?? '';
    const db = b.ate ?? b.de ?? '';
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return db.localeCompare(da);
  });
}

/** Lista de problemas em PT-BR, pronta pra tela. Vazia = pode gravar. */
export function problemasDaEntrada(e: EntradaDeEstante): string[] {
  const problemas: string[] = [];

  if (!materialPorId(e.materialId)) {
    problemas.push('Esse material não está no catálogo.');
  }
  if (e.de && e.ate && e.de > e.ate) {
    problemas.push('A data de início vem depois da de fim.');
  }
  if (e.motivo !== undefined) {
    const t = e.motivo.trim();
    if (t.length > 0 && t.length < MOTIVO_MINIMO) {
      problemas.push(`O motivo precisa de pelo menos ${MOTIVO_MINIMO} caracteres.`);
    }
    if (t.length > MOTIVO_MAXIMO) {
      problemas.push(`O motivo passa de ${MOTIVO_MAXIMO} caracteres — isso já é uma avaliação.`);
    }
  }
  return problemas;
}

/** O que terceiro pode ler. O dono usa a lista crua. */
export const motivoVisivel = (e: EntradaDeEstante, souODono: boolean): string | undefined =>
  souODono || e.motivoStatus === 'aprovada' ? e.motivo : undefined;
```

- [ ] **Passo 4: rode e veja passar**

Rode: `npx tsx testes/rodar.ts`
Esperado: 8 asserções a mais, nenhuma falha.

- [ ] **Passo 5: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(estante): o historico de equipamento como modulo puro

Ordenacao: em uso primeiro, depois o mais recente, e sem data nenhuma vai pro
fim -- colocar no meio seria afirmar uma cronologia que a pessoa nao deu.

`motivoVisivel` e' onde mora a regra do D-14: fato aparece na hora, prosa espera
gente, e o dono ve' sempre o proprio texto.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add src/logica/estante.ts && git commit -F /tmp/c.txt
git add testes/rodar.ts && git commit -F /tmp/c.txt
```

---

## Task 5: Migração 015 — `estante` e `estante_motivos`

**Arquivos:**
- Criar: `supabase/015-estante.sql`

- [ ] **Passo 1: escreva a migração**

```sql
-- WikiPong · 015 · a estante, e a separacao entre fato e prosa
-- ----------------------------------------------------------------------------
-- POR QUE DUAS TABELAS e nao uma coluna a mais: a RLS do Postgres filtra
-- LINHAS, nao colunas. E' a mesma pedra da migracao 010, onde
-- `marcar_resposta_util` virou funcao justamente por isso.
--
-- Com uma tabela so', esconder o motivo pendente sem esconder o material
-- exigiria grant por coluna mais funcoes security definer pro dono e pro admin
-- lerem o que e' deles. Com duas, RLS pura resolve.
--
-- A regra que isso implementa e' o D-14, literalmente: FATO SE PUBLICA SOZINHO,
-- PROSA ESPERA GENTE.

create table if not exists public.estante (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users (id) on delete cascade,
  -- Id de material, nao FK: o catalogo mora em JSON versionado no repo (D-17).
  material_id text not null,
  de          date,
  ate         date,
  criado_em   timestamptz not null default now(),
  constraint estante_periodo_coerente check (de is null or ate is null or de <= ate)
);

create table if not exists public.estante_motivos (
  estante_id uuid primary key references public.estante (id) on delete cascade,
  -- Desnormalizado de proposito: a politica de leitura precisa dele sem join.
  usuario_id uuid not null references auth.users (id) on delete cascade,
  texto      text not null check (char_length(trim(texto)) between 10 and 280),
  status     text not null default 'pendente'
                  check (status in ('pendente', 'aprovada', 'descartada')),
  criado_em  timestamptz not null default now()
);

create index if not exists estante_por_usuario on public.estante (usuario_id);
create index if not exists estante_motivos_pendentes
  on public.estante_motivos (status) where status = 'pendente';

alter table public.estante         enable row level security;
alter table public.estante_motivos enable row level security;

-- ───────────────────────── RLS ─────────────────────────
-- UMA POLITICA POR PAPEL, sempre com `to` explicito. Politica sem `to` tambem
-- se aplica ao anon e devolve 401 -- foi o que quebrou a leitura publica na 007.

-- A estante e' fato: qualquer um le'.
drop policy if exists "leitura publica da estante" on public.estante;
create policy "leitura publica da estante"
  on public.estante for select to anon using (true);

drop policy if exists "leitura da estante" on public.estante;
create policy "leitura da estante"
  on public.estante for select to authenticated using (true);

drop policy if exists "dono escreve a propria estante" on public.estante;
create policy "dono escreve a propria estante"
  on public.estante for insert to authenticated
  with check (usuario_id = (select auth.uid()));

drop policy if exists "dono atualiza a propria estante" on public.estante;
create policy "dono atualiza a propria estante"
  on public.estante for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

drop policy if exists "dono apaga a propria estante" on public.estante;
create policy "dono apaga a propria estante"
  on public.estante for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- O motivo e' prosa: so' aprovado e' publico.
drop policy if exists "leitura publica de motivo aprovado" on public.estante_motivos;
create policy "leitura publica de motivo aprovado"
  on public.estante_motivos for select to anon
  using (status = 'aprovada');

drop policy if exists "leitura de motivo" on public.estante_motivos;
create policy "leitura de motivo"
  on public.estante_motivos for select to authenticated
  using (status = 'aprovada' or usuario_id = (select auth.uid()) or public.eh_admin());

-- DUAS ARMADILHAS DE COLUNA, evitadas de proposito:
--
-- 1. O `with check` exige status = 'pendente'. Sem essa clausula, o dono
--    publicaria o proprio motivo mandando "status":"aprovada" no corpo do POST,
--    e a fila de moderacao viraria enfeite. RLS nao consegue dizer "pode mexer
--    nesta coluna mas nao naquela" -- entao a restricao vai no valor.
drop policy if exists "dono escreve o proprio motivo" on public.estante_motivos;
create policy "dono escreve o proprio motivo"
  on public.estante_motivos for insert to authenticated
  with check (usuario_id = (select auth.uid()) and status = 'pendente');

-- 2. O dono NAO tem update, so' insert e delete. Editar um motivo e' apagar e
--    escrever outro -- o que de quebra e' o comportamento certo: texto
--    reescrito volta pra fila em vez de herdar a aprovacao do texto velho.
drop policy if exists "dono apaga o proprio motivo" on public.estante_motivos;
create policy "dono apaga o proprio motivo"
  on public.estante_motivos for delete to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists "admin modera motivo" on public.estante_motivos;
create policy "admin modera motivo"
  on public.estante_motivos for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());
```

- [ ] **Passo 2: rode no Supabase**

SQL Editor → Run. Esperado: `Success. No rows returned`.

- [ ] **Passo 3: prove que a armadilha está fechada**

Logado como usuário comum, tente publicar o próprio motivo:

```bash
curl -s -X POST "$SUPABASE_URL/rest/v1/estante_motivos" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_DE_USUARIO" \
  -H "Content-Type: application/json" \
  -d '{"estante_id":"<um id seu>","usuario_id":"<seu id>","texto":"tentando publicar sozinho","status":"aprovada"}'
```
Esperado: **401 ou 403** com `new row violates row-level security policy`. Se isso retornar 201, a política está errada — pare e conserte antes de seguir.

- [ ] **Passo 4: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(estante): as duas tabelas, e a separacao entre fato e prosa

Duas tabelas e nao uma coluna a mais porque a RLS filtra LINHA e nao COLUNA --
a mesma pedra da migracao 010.

Duas armadilhas fechadas de proposito: o insert exige status 'pendente' (senao
o dono publica o proprio motivo pelo corpo do POST e a fila vira enfeite), e o
dono nao tem update nenhum (editar e' apagar e reescrever, entao texto novo
volta pra fila em vez de herdar aprovacao velha).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add supabase/015-estante.sql && git commit -F /tmp/c.txt
```

---

## Task 6: Repositório da estante

**Arquivos:**
- Modificar: `src/logica/estante.ts`
- Modificar: `testes/rodar.ts`

- [ ] **Passo 1: escreva o teste que falha**

```ts
/* O repositorio local existe pra tela funcionar deslogado, como o de perfil. */
afirma(typeof repositorioEstante === 'function',
  'estante: precisa de fabrica de repositorio, como perfil e avaliacoes');
afirma(repositorioEstanteLocal().somenteLocal === true,
  'estante: o repositorio local tem que se declarar local');
```

Junte ao import de `estante.js` já criado: `repositorioEstante, repositorioEstanteLocal`.

- [ ] **Passo 2: rode e veja falhar**

Rode: `npx tsx testes/rodar.ts`
Esperado: `repositorioEstante` não é exportado.

- [ ] **Passo 3: implemente**

No fim de `src/logica/estante.ts`:

```ts
export interface RepositorioEstante {
  readonly somenteLocal: boolean;
  listar(usuarioId?: string): Promise<EntradaDeEstante[]>;
  adicionar(e: Omit<EntradaDeEstante, 'id'>): Promise<void>;
  remover(id: string): Promise<void>;
}

const CHAVE_LOCAL = 'wikipong:estante:v1';

export function repositorioEstanteLocal(): RepositorioEstante {
  const ler = (): EntradaDeEstante[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? '[]') as EntradaDeEstante[];
    } catch {
      return [];
    }
  };
  const gravar = (es: EntradaDeEstante[]) => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(es));
    } catch {
      /* Quota estourada não pode virar tela branca. */
    }
  };
  return {
    somenteLocal: true,
    async listar() { return ler(); },
    async adicionar(e) {
      /* Deslogado, o segundo par de olhos é o dono do navegador: o motivo já
         nasce aprovado porque não sai deste aparelho. */
      gravar([...ler(), { ...e, id: crypto.randomUUID(), motivoStatus: 'aprovada' }]);
    },
    async remover(id) { gravar(ler().filter((e) => e.id !== id)); },
  };
}

export function repositorioEstanteSupabase(
  url: string, chave: string, token: string | null, usuarioId: string | null,
): RepositorioEstante {
  const raiz = url.replace(/\/$/, '');
  const cabecalhos = (): Record<string, string> => {
    const h: Record<string, string> = { apikey: chave, 'Content-Type': 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  type LinhaEstante = {
    id: string; usuario_id: string; material_id: string;
    de: string | null; ate: string | null;
    estante_motivos: { texto: string; status: string }[] | null;
  };

  return {
    somenteLocal: false,
    async listar(deQuem) {
      const quem = deQuem ?? usuarioId;
      if (!quem) return [];
      /* O motivo vem por embed. Quem não pode lê-lo recebe lista vazia aqui —
         a RLS filtra, e a tela não precisa saber de nada disso. */
      const res = await fetch(
        `${raiz}/rest/v1/estante?usuario_id=eq.${encodeURIComponent(quem)}` +
        `&select=*,estante_motivos(texto,status)&order=criado_em.desc`,
        { headers: cabecalhos() },
      );
      if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
      return ((await res.json()) as LinhaEstante[]).map((l) => {
        const m = l.estante_motivos?.[0];
        return {
          id: l.id,
          materialId: l.material_id,
          de: l.de ?? undefined,
          ate: l.ate ?? undefined,
          motivo: m?.texto,
          motivoStatus: m?.status as StatusMotivo | undefined,
        };
      });
    },
    async adicionar(e) {
      if (!usuarioId) throw new Error('Entre para guardar sua estante.');
      const res = await fetch(`${raiz}/rest/v1/estante`, {
        method: 'POST',
        headers: { ...cabecalhos(), Prefer: 'return=representation' },
        body: JSON.stringify({
          usuario_id: usuarioId, material_id: e.materialId,
          de: e.de ?? null, ate: e.ate ?? null,
        }),
      });
      if (!res.ok) throw new Error(`Supabase recusou a entrada (${res.status})`);

      const texto = e.motivo?.trim();
      if (!texto) return;
      const criada = ((await res.json()) as { id: string }[])[0];
      /* `status` vai explícito e igual ao que a política exige. Mandar outra
         coisa aqui é 403 — e é assim que tem que ser. */
      await fetch(`${raiz}/rest/v1/estante_motivos`, {
        method: 'POST',
        headers: { ...cabecalhos(), Prefer: 'return=minimal' },
        body: JSON.stringify({
          estante_id: criada.id, usuario_id: usuarioId, texto, status: 'pendente',
        }),
      });
    },
    async remover(id) {
      /* O motivo cai junto pelo `on delete cascade`. */
      const res = await fetch(`${raiz}/rest/v1/estante?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: cabecalhos(),
      });
      if (!res.ok) throw new Error(`Supabase recusou a remoção (${res.status})`);
    },
  };
}

/** Sem servidor, a estante mora no navegador — igual ao perfil. */
export function repositorioEstante(token?: string | null, usuarioId?: string | null): RepositorioEstante {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return repositorioEstanteLocal();
  return repositorioEstanteSupabase(url, chave, token ?? chave, usuarioId ?? null);
}
```

- [ ] **Passo 4: rode e veja passar**

Rode: `npx tsx testes/rodar.ts`
Esperado: 2 asserções a mais, nenhuma falha.

- [ ] **Passo 5: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(estante): repositorios local e Supabase

O motivo vem por embed na leitura; quem nao pode le-lo recebe vazio pela RLS, e
a tela nao precisa saber de nada disso. Na escrita, `status` vai explicito e
igual ao que a politica exige -- mandar outra coisa e' 403, e e' assim que tem
que ser.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add src/logica/estante.ts && git commit -F /tmp/c.txt
git add testes/rodar.ts && git commit -F /tmp/c.txt
```

---

## Task 7: `atividade.ts` — a linha do tempo

**Arquivos:**
- Criar: `src/logica/atividade.ts`
- Modificar: `testes/rodar.ts`

- [ ] **Passo 1: escreva o teste que falha**

```ts
/* ───────── atividade: as tres fontes numa linha do tempo so' ───────── */
const EU = 'usuario-1';
const linha = linhaDoTempo(
  [{ ...avaliacaoDeTeste, id: 'a1', usuarioId: EU, criadoEm: '2026-03-01T10:00:00Z' }],
  [{ ...topicoDeTeste, id: 't1', usuarioId: EU, criadoEm: '2026-05-01T10:00:00Z' }],
  [{ ...mensagemDeTeste, id: 'r1', usuarioId: EU, criadoEm: '2026-04-01T10:00:00Z', topicoId: 't9' }],
  EU,
);
afirma(linha.length === 3, 'atividade: junta as tres fontes');
afirma(linha[0].tipo === 'topico' && linha[2].tipo === 'avaliacao',
  'atividade: mais recente primeiro, independente da fonte');
afirma(linha.every((a) => a.para.startsWith('/')),
  'atividade: todo item precisa de um destino clicavel');
afirma(linhaDoTempo([], [], [], EU).length === 0,
  'atividade: sem nada, devolve lista vazia em vez de quebrar');
/* Pedido de pauta e' recado pra casa, nao contribuicao publica. */
afirma(!('pedido' in { tipo: '' as Atividade['tipo'] }),
  'atividade: pedido de pauta nao entra na linha do tempo publica');
```

> `avaliacaoDeTeste`, `topicoDeTeste` e `mensagemDeTeste` já existem no arquivo de testes. Se algum não tiver o campo `usuarioId`, adicione-o ao literal — os três tipos já o declaram como opcional.

Import:

```ts
import { linhaDoTempo, type Atividade } from '../src/logica/atividade.js';
```

- [ ] **Passo 2: rode e veja falhar**

Rode: `npx tsx testes/rodar.ts`
Esperado: `Cannot find module '../src/logica/atividade.js'`.

- [ ] **Passo 3: escreva o módulo**

```ts
/**
 * WikiPong · O que a pessoa fez na comunidade
 * ------------------------------------------------------------------------------
 * Avaliação, tópico e resposta são coisas diferentes no banco e a mesma coisa
 * pro leitor: "isto aqui foi ela que escreveu, nesta data". Este módulo faz a
 * tradução e devolve uma lista só, já ordenada.
 *
 * PEDIDO DE PAUTA FICA DE FORA, de propósito. Pedir um assunto é um recado pra
 * casa, não uma contribuição pública — e quem pediu pode não querer aquilo
 * exposto no próprio perfil.
 */
import type { Avaliacao } from './avaliacoes';
import type { Mensagem, Topico } from './discussoes';

export interface Atividade {
  tipo: 'avaliacao' | 'topico' | 'resposta';
  id: string;
  /** ISO 8601. */
  quando: string;
  /** A linha que a tela mostra. */
  titulo: string;
  /** Para onde o item leva. Sempre começa com `/`. */
  para: string;
}

type RespostaComTopico = Mensagem & { topicoId?: string };

export function linhaDoTempo(
  avaliacoes: readonly Avaliacao[],
  topicos: readonly Topico[],
  respostas: readonly RespostaComTopico[],
  usuarioId: string,
): Atividade[] {
  const meu = <T extends { usuarioId?: string }>(x: T) => x.usuarioId === usuarioId;

  const itens: Atividade[] = [
    ...avaliacoes.filter(meu).map((a): Atividade => ({
      tipo: 'avaliacao', id: a.id, quando: a.criadoEm,
      titulo: a.texto, para: `/materiais/${a.materialId}/`,
    })),
    ...topicos.filter(meu).map((t): Atividade => ({
      tipo: 'topico', id: t.id, quando: t.criadoEm,
      titulo: t.titulo, para: `/comunidade/discussoes/?t=${t.id}`,
    })),
    ...respostas.filter(meu).map((r): Atividade => ({
      tipo: 'resposta', id: r.id, quando: r.criadoEm,
      titulo: r.texto,
      para: r.topicoId ? `/comunidade/discussoes/?t=${r.topicoId}` : '/comunidade/discussoes/',
    })),
  ];

  return itens.sort((a, b) => b.quando.localeCompare(a.quando));
}

export const ROTULO_ATIVIDADE: Readonly<Record<Atividade['tipo'], string>> = {
  avaliacao: 'avaliou',
  topico: 'abriu a discussão',
  resposta: 'respondeu',
};
```

- [ ] **Passo 4: rode e veja passar**

Rode: `npx tsx testes/rodar.ts`
Esperado: 5 asserções a mais, nenhuma falha.

- [ ] **Passo 5: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(atividade): as tres fontes numa linha do tempo so'

Avaliacao, topico e resposta sao coisas diferentes no banco e a mesma coisa pro
leitor. Pedido de pauta fica de fora de proposito: e' recado pra casa, nao
contribuicao publica, e quem pediu pode nao querer aquilo no proprio perfil.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add src/logica/atividade.ts && git commit -F /tmp/c.txt
git add testes/rodar.ts && git commit -F /tmp/c.txt
```

---

## Task 8: A procedência de quem avalia

**Arquivos:**
- Criar: `src/logica/procedencia-do-avaliador.ts`
- Modificar: `testes/rodar.ts`

> **Correção que veio do código, não do spec.** O desenho pedia "tempo médio de uso" e "se já usou os dois lados". Nenhum dos dois é derivável: `Avaliacao` guarda `tempoDeUso` como **faixa** (`'1 a 6 meses'`), não como número, e não guarda lado nenhum. Média de faixa exigiria carimbar um número no meio de cada intervalo — precisão inventada. Entram no lugar `faixaTipica` (a faixa mais frequente, empate vai pra mais longa) e a contagem de borrachas e lâminas, que sai do `tipo` do material.

- [ ] **Passo 1: escreva o teste que falha**

```ts
/* ───────── procedencia de quem avalia ───────── */
const doAvaliador = procedenciaDe([
  { ...avaliacaoDeTeste, id: 'p1', materialId: 'yasaka-mark-v', tempoDeUso: 'mais de 1 ano' },
  { ...avaliacaoDeTeste, id: 'p2', materialId: 'yasaka-mark-v', tempoDeUso: '1 a 6 meses' },
  { ...avaliacaoDeTeste, id: 'p3', materialId: 'butterfly-tenergy-05', tempoDeUso: 'mais de 1 ano' },
]);
afirma(doAvaliador.quantas === 3, 'procedencia: conta as avaliacoes');
afirma(doAvaliador.materiaisDistintos === 2,
  'procedencia: duas avaliacoes do mesmo material contam como um material');
afirma(doAvaliador.faixaTipica === 'mais de 1 ano',
  'procedencia: a faixa tipica e' a mais frequente, nao uma media inventada');
afirma(doAvaliador.borrachas + doAvaliador.laminas === doAvaliador.materiaisDistintos,
  'procedencia: todo material distinto e' borracha ou lamina');
afirma(procedenciaDe([]).quantas === 0 && procedenciaDe([]).faixaTipica === undefined,
  'procedencia: sem avaliacao, nao invento faixa nenhuma');
```

Import:

```ts
import { procedenciaDe } from '../src/logica/procedencia-do-avaliador.js';
```

- [ ] **Passo 2: rode e veja falhar**

Rode: `npx tsx testes/rodar.ts`
Esperado: `Cannot find module '../src/logica/procedencia-do-avaliador.js'`.

- [ ] **Passo 3: escreva o módulo**

```ts
/**
 * WikiPong · Quem é a pessoa que escreveu aquela avaliação
 * ------------------------------------------------------------------------------
 * A Regra da Voz de Dados aplicada a gente em vez de a material: isto NÃO
 * devolve selo, nota nem "avaliador confiável". Devolve os números, e quem lê
 * julga sozinho.
 *
 * O QUE NÃO TEM AQUI, e por quê: "tempo médio de uso" não existe porque
 * `tempoDeUso` é uma FAIXA, não um número — tirar média exigiria carimbar um
 * valor no meio de cada intervalo, que é precisão inventada. No lugar vai a
 * faixa mais frequente, que é um fato sobre os dados. "Usou os dois lados"
 * também não existe: a avaliação não guarda lado nenhum.
 */
import { TEMPOS_DE_USO, type Avaliacao, type TempoDeUso } from './avaliacoes';
import { materialPorId } from '../../componentes/dados-materiais';

export interface ProcedenciaDoAvaliador {
  quantas: number;
  materiaisDistintos: number;
  borrachas: number;
  laminas: number;
  /** A faixa mais frequente. Ausente quando não há avaliação. */
  faixaTipica?: TempoDeUso;
}

export function procedenciaDe(avaliacoes: readonly Avaliacao[]): ProcedenciaDoAvaliador {
  const ids = new Set(avaliacoes.map((a) => a.materialId));
  const tipos = [...ids].map((id) => materialPorId(id)?.tipo);

  /* Empate vai pra faixa mais longa: entre "1 a 6 meses" e "mais de 1 ano" com
     a mesma contagem, a informação honesta é a que exige mais compromisso. */
  let faixaTipica: TempoDeUso | undefined;
  let maior = 0;
  for (const faixa of TEMPOS_DE_USO) {
    const quantas = avaliacoes.filter((a) => a.tempoDeUso === faixa).length;
    if (quantas >= maior && quantas > 0) { maior = quantas; faixaTipica = faixa; }
  }

  return {
    quantas: avaliacoes.length,
    materiaisDistintos: ids.size,
    borrachas: tipos.filter((t) => t === 'Borracha').length,
    laminas: tipos.filter((t) => t === 'Lâmina').length,
    faixaTipica,
  };
}
```

> `TEMPOS_DE_USO` está em ordem crescente de compromisso (`'menos de 1 mês'` → `'mais de 1 ano'`), e é isso que faz o `>=` resolver o empate pra faixa mais longa. Se a ordem daquele array mudar, este comportamento muda junto — o teste da faixa típica é o que avisa.

- [ ] **Passo 4: rode e veja passar**

Rode: `npx tsx testes/rodar.ts`
Esperado: 5 asserções a mais, nenhuma falha.

- [ ] **Passo 5: commit**

```bash
cat > /tmp/c.txt <<'EOF'
perf(perfil): os numeros de quem avalia, sem selo nenhum

A Regra da Voz de Dados aplicada a gente: nao devolve "avaliador confiavel",
devolve os numeros e quem le' julga.

Duas coisas do spec sairam porque nao sao derivaveis: "tempo medio de uso"
exigiria carimbar um numero no meio de cada faixa (precisao inventada), e "usou
os dois lados" nao existe porque a avaliacao nao guarda lado. No lugar: a faixa
mais frequente, e a contagem de borrachas e laminas.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add src/logica/procedencia-do-avaliador.ts && git commit -F /tmp/c.txt
git add testes/rodar.ts && git commit -F /tmp/c.txt
```

---

## Task 9: "Resolveu N dúvidas"

**Arquivos:**
- Modificar: `src/logica/discussoes.ts`
- Modificar: `testes/rodar.ts`

- [ ] **Passo 1: escreva o teste que falha**

```ts
/* ───────── resolveu quantas ───────── */
const meusTopicos: Topico[] = [
  { ...topicoDeTeste, id: 'x1', respostaUtil: 'r-minha',
    respostas: [{ ...mensagemDeTeste, id: 'r-minha', usuarioId: 'eu' }] },
  { ...topicoDeTeste, id: 'x2', respostaUtil: 'r-outra',
    respostas: [{ ...mensagemDeTeste, id: 'r-outra', usuarioId: 'outro' }] },
  { ...topicoDeTeste, id: 'x3', respostas: [{ ...mensagemDeTeste, id: 'r3', usuarioId: 'eu' }] },
];
afirma(resolveuQuantas(meusTopicos, 'eu') === 1,
  'resolveu: conta so' a resposta marcada como a que resolveu');
afirma(resolveuQuantas(meusTopicos, 'ninguem') === 0,
  'resolveu: quem nao resolveu nada tem zero, nao undefined');
```

- [ ] **Passo 2: rode e veja falhar**

Rode: `npx tsx testes/rodar.ts`
Esperado: `resolveuQuantas` não é exportado de `discussoes.js`.

- [ ] **Passo 3: implemente**

No fim de `src/logica/discussoes.ts`:

```ts
/**
 * Quantas vezes a resposta desta pessoa foi a que resolveu o tópico.
 *
 * É o único número de reputação que este site guarda, e é de propósito: ele é
 * GANHO, não declarado — quem marca é quem perguntou. Contagem de mensagens ou
 * de curtidas premiaria volume, e volume muda o que as pessoas escrevem.
 */
export function resolveuQuantas(topicos: readonly Topico[], usuarioId: string): number {
  return topicos.filter((t) =>
    Boolean(t.respostaUtil) &&
    t.respostas.some((r) => r.id === t.respostaUtil && r.usuarioId === usuarioId),
  ).length;
}
```

- [ ] **Passo 4: rode e veja passar**

Rode: `npx tsx testes/rodar.ts`
Esperado: 2 asserções a mais, nenhuma falha.

- [ ] **Passo 5: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(discussoes): quantas duvidas a pessoa resolveu

O unico numero de reputacao que este site guarda, e de proposito: ele e' GANHO,
nao declarado -- quem marca e' quem perguntou. Contagem de mensagem ou de
curtida premiaria volume, e volume muda o que as pessoas escrevem.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add src/logica/discussoes.ts && git commit -F /tmp/c.txt
git add testes/rodar.ts && git commit -F /tmp/c.txt
```

---

## Task 10: `RaqueteRetrato` — a raquete como retrato

**Arquivos:**
- Criar: `componentes/RaqueteRetrato.tsx`
- Criar: `componentes/RaqueteRetrato.module.css`

Componente puro de apresentação, usado nas duas telas. Sem estado, sem busca de dados: recebe os ids e desenha.

- [ ] **Passo 1: escreva o componente**

```tsx
/**
 * WikiPong · A raquete de alguém, como retrato
 * ------------------------------------------------------------------------------
 * Num site de equipamento, a raquete diz mais sobre a pessoa que a cara dela.
 * Por isso o centro do perfil é isto, e não um avatar.
 *
 * O radar é `aria-hidden`: a alternativa acessível é a lista de peças, que fica
 * logo acima e diz tudo que o desenho diz. Mesmo padrão do /comparar.
 */
'use client';

import Link from 'next/link';
import { Radar } from './Radar';
import { FotoProduto } from './FotoProduto';
import { materialPorId } from './dados-materiais';
import { metricasDaMontagem } from '../src/logica/montagem';
import { nomeComMarca } from './formato';
import estilos from './RaqueteRetrato.module.css';

const PAPEL = { lamina: 'Lâmina', fh: 'Forehand', bh: 'Backhand' } as const;

export function RaqueteRetrato({
  equipamento,
  comparar,
}: {
  equipamento: { lamina?: string; fh?: string; bh?: string };
  /** Métricas da SUA raquete, para sobrepor. Ausente = sem comparação. */
  comparar?: { rotulo: string; metricas: ReturnType<typeof metricasDaMontagem> };
}) {
  const pecas = (['lamina', 'fh', 'bh'] as const)
    .map((papel) => ({ papel, material: equipamento[papel] ? materialPorId(equipamento[papel]!) : undefined }))
    .filter((p) => p.material);

  /* Bloco sem dado desaparece inteiro. Perfil novo mostra o pouco que tem, não
     uma lista das suas ausências. */
  if (pecas.length === 0) return null;

  const minhas = metricasDaMontagem(equipamento);

  return (
    <section className={estilos.retrato} aria-labelledby="t-raquete">
      <h2 id="t-raquete" className={estilos.titulo}>A raquete</h2>

      <ul className={estilos.pecas}>
        {pecas.map(({ papel, material }) => (
          <li key={papel} className={estilos.peca}>
            <span className={`mono ${estilos.papel}`}>{PAPEL[papel]}</span>
            <Link href={`/materiais/${material!.id}/`} className={estilos.pecaLink}>
              <FotoProduto material={material!} tamanho={64} />
              <span>{nomeComMarca(material!.marca, material!.nome)}</span>
            </Link>
          </li>
        ))}
      </ul>

      {minhas && (
        <Radar
          metricas={minhas}
          sobreposto={comparar?.metricas ?? undefined}
          rotuloSobreposto={comparar?.rotulo}
        />
      )}
    </section>
  );
}
```

> **Antes de escrever este arquivo, confira as três assinaturas reais:** `Radar` (`componentes/Radar.tsx` — nomes das props de sobreposição), `FotoProduto` (nome da prop de tamanho) e `metricasDaMontagem` (`src/logica/montagem.ts` — pode se chamar diferente; use `grep -n "export" src/logica/montagem.ts`). Ajuste as chamadas ao que existe, não o contrário.

- [ ] **Passo 2: escreva o CSS**

```css
/* Retrato da raquete. Sem sombra e sem borda arredondada além do que o resto do
   site já usa — o destaque aqui é a foto do produto, não a moldura. */
.retrato { margin: var(--esp-6) 0; }

.titulo {
  font-family: var(--fonte-titulo);
  font-size: var(--tam-3);
  margin-bottom: var(--esp-3);
}

.pecas { list-style: none; display: grid; gap: var(--esp-3); padding: 0; margin: 0 0 var(--esp-4); }

@media (min-width: 40rem) {
  .pecas { grid-template-columns: repeat(3, 1fr); }
}

.peca { display: flex; flex-direction: column; gap: var(--esp-1); }

.papel {
  font-size: var(--tam-0);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--cor-texto-suave);
}

.pecaLink {
  display: flex; align-items: center; gap: var(--esp-2);
  color: inherit; text-decoration: none;
  border-radius: var(--raio-1);
}

.pecaLink:hover { color: var(--cor-texto-acento); }

.pecaLink:focus-visible {
  outline: 2px solid var(--cor-acento);
  outline-offset: 3px;
}
```

> Confira os nomes das variáveis (`--esp-3`, `--tam-3`, `--cor-texto-suave`, `--raio-1`) em `app/globals.css` e troque pelas que existem. **Não invente token novo.**

- [ ] **Passo 3: prove que compila**

Rode: `npx tsc --noEmit`
Esperado: sem erro.

- [ ] **Passo 4: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(perfil): a raquete como retrato

Num site de equipamento, a raquete diz mais sobre a pessoa que a cara dela --
por isso o centro do perfil e' isto, e nao um avatar.

Bloco sem peca nenhuma desaparece inteiro, em vez de dizer "nenhum material".
Perfil novo mostra o pouco que tem, nao uma lista das suas ausencias.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add componentes/RaqueteRetrato.tsx && git commit -F /tmp/c.txt
git add componentes/RaqueteRetrato.module.css && git commit -F /tmp/c.txt
```

---

## Task 11: A tela pública

**Arquivos:**
- Criar: `app/comunidade/jogador/page.tsx`
- Criar: `app/comunidade/jogador/jogador-cliente.tsx`
- Criar: `app/comunidade/jogador/jogador.module.css`

- [ ] **Passo 1: a casca estática**

`app/comunidade/jogador/page.tsx`:

```tsx
/**
 * WikiPong · Perfil público de um jogador
 * ------------------------------------------------------------------------------
 * POR QUE `?p=` E NÃO `/jogador/<apelido>/`: o site é export estático (D-17), e
 * rota dinâmica em export só emite os caminhos que `generateStaticParams`
 * devolve NO BUILD. Perfil nasce depois do build — quem se cadastrasse depois do
 * último push cairia em 404 até a próxima publicação.
 *
 * Uma página só, que lê o apelido da query. Mesmo padrão do /catalogo, e de
 * acordo com o D-12: estado navegável vive na URL.
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { JogadorCliente } from './jogador-cliente';

export const metadata: Metadata = {
  title: 'Perfil de jogador · WikiPong',
  description: 'Estilo, equipamento e contribuições de quem participa da comunidade da WikiPong.',
};

export default function Pagina() {
  return (
    <main className="conteudo">
      <Suspense fallback={<p>Carregando…</p>}>
        <JogadorCliente />
      </Suspense>
    </main>
  );
}
```

> `useSearchParams` exige `Suspense` no App Router — sem ele o build falha. O `/catalogo` já resolve assim; copie o padrão de lá se divergir.

- [ ] **Passo 2: a tela**

`app/comunidade/jogador/jogador-cliente.tsx` — client component. Estrutura, de cima para baixo:

1. Lê `p` de `useSearchParams()`.
2. Busca o perfil: `perfis?apelido=eq.<p>&select=*`. Vazio → estado "esse jogador não existe", com link para `/comunidade/`.
3. Busca em paralelo: estante (`repositorioEstante().listar(usuarioId)`), avaliações, tópicos e respostas dessa pessoa.
4. Desenha, nesta ordem: cabeçalho → `<RaqueteRetrato>` → procedência → estante → atividade.
5. Cada bloco só existe se tiver dado (`if (x.length === 0) return null`).
6. A comparação só entra quando há sessão **e** a pessoa logada tem raquete montada — passa `comparar` para o `RaqueteRetrato`.

Regras que não podem escapar:

- Motivo de estante: use `motivoVisivel(entrada, souODono)`, nunca `entrada.motivo` direto. `souODono` = id da sessão igual ao dono do perfil.
- Falha de rede não pode virar tela branca: o que já carregou fica, e o bloco que falhou some.
- O radar é `aria-hidden` (já vem assim do `RaqueteRetrato`).

- [ ] **Passo 3: prove que compila e que exporta**

Rode: `npm run build`
Esperado: `✓ Compiled successfully` e `/comunidade/jogador` na lista de rotas como `○ (Static)`.

- [ ] **Passo 4: confira nos dois temas**

Rode `npm run dev`, abra `/comunidade/jogador/?p=<um apelido real>` e depois o mesmo com o tema escuro do sistema. Confira: contraste do texto acentuado, foco visível ao navegar por Tab, e o radar sem animação com `prefers-reduced-motion` ligado.

- [ ] **Passo 5: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(perfil): a tela publica do jogador

?p= e nao /jogador/<apelido>/ porque o site e' export estatico: rota dinamica
so' emite o que generateStaticParams devolve NO BUILD, e perfil nasce depois --
quem se cadastrasse depois do ultimo push cairia em 404.

Bloco sem dado desaparece inteiro. O motivo da estante passa por
`motivoVisivel`, nunca direto: e' ali que a regra do dono ver o proprio texto
pendente e' aplicada.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add app/comunidade/jogador/page.tsx && git commit -F /tmp/c.txt
git add app/comunidade/jogador/jogador-cliente.tsx && git commit -F /tmp/c.txt
git add app/comunidade/jogador/jogador.module.css && git commit -F /tmp/c.txt
```

---

## Task 12: A tela de edição ganha os campos novos e a estante

**Arquivos:**
- Criar: `componentes/EstanteEditor.tsx`
- Modificar: `app/comunidade/perfil/perfil-cliente.tsx`

- [ ] **Passo 1: o editor da estante**

`componentes/EstanteEditor.tsx`: lista as entradas por `ordenarEstante`, cada uma com material, período e motivo; botão **Remover** por entrada; formulário de adicionar com seletor de material (o mesmo padrão do seletor que já existe em `perfil-cliente.tsx`), `de`, `ate` e motivo.

Regras:

- **Não existe botão "editar".** Editar é remover e adicionar de novo — porque texto reescrito precisa voltar pra fila em vez de herdar a aprovação do texto velho. Diga isso na tela, numa linha: *"Pra mudar o motivo, remova e escreva de novo — texto novo passa pela moderação outra vez."*
- Motivo pendente aparece pro dono com uma marca discreta: *"esperando revisão"*.
- Antes de gravar, chame `problemasDaEntrada` e mostre a lista; botão desligado enquanto houver problema.

- [ ] **Passo 2: os campos novos no perfil**

Em `app/comunidade/perfil/perfil-cliente.tsx`, na seção de identidade, acrescente `mao` e `empunhadura` (selects alimentados por `MAOS`/`EMPUNHADURAS` e `ROTULO_*`), `cidade`, `uf` e `procuro` (com contador de caracteres até 120).

Depois da seção de equipamento, monte `<EstanteEditor />`.

E o crachá de prévia deixa de ser promessa: quando `perfil.apelido` existir, envolva-o num `Link` para `/comunidade/jogador/?p=${perfil.apelido}` com o texto **"ver como os outros veem →"**.

- [ ] **Passo 3: prove que compila**

Rode: `npx tsc --noEmit && npm run build`
Esperado: sem erro; `✓ Compiled successfully`.

- [ ] **Passo 4: teste à mão**

`npm run dev`, logado: preencha mão, empunhadura e "procuro", salve, recarregue — os valores voltam. Adicione uma entrada de estante com motivo; confirme que ela aparece com "esperando revisão" pra você.

- [ ] **Passo 5: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(perfil): a tela de edicao ganha os campos novos e a estante

O cracha deixa de prometer: "e' assim que voce aparece" agora e' link pra
pagina onde voce aparece assim.

Nao ha botao de editar motivo, de proposito: editar e' remover e escrever de
novo, porque texto reescrito tem que voltar pra fila em vez de herdar a
aprovacao do texto velho. A tela diz isso em vez de deixar a pessoa descobrir.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add componentes/EstanteEditor.tsx && git commit -F /tmp/c.txt
git add app/comunidade/perfil/perfil-cliente.tsx && git commit -F /tmp/c.txt
```

---

## Task 13: O nome vira link

**Arquivos:**
- Criar: `componentes/apelidos.ts`
- Modificar: `componentes/AvaliacoesMaterial.tsx`
- Modificar: `app/comunidade/discussoes/discussoes-cliente.tsx`

- [ ] **Passo 1: a busca em lote**

`componentes/apelidos.ts`:

```ts
/**
 * WikiPong · De id de usuário para apelido, em lote
 * ------------------------------------------------------------------------------
 * As listagens (avaliações, discussões) trazem `usuario_id`, e o link do perfil
 * precisa do apelido. Uma consulta por linha seria uma consulta por avaliação
 * na tela — isto resolve todas de uma vez.
 *
 * Falha vira mapa vazio, nunca erro: sem apelido o nome fica texto simples, que
 * é exatamente como está hoje. Perder o link não pode derrubar a lista.
 */
export async function apelidosDe(ids: readonly (string | undefined)[]): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (unicos.length === 0) return new Map();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return new Map();

  try {
    const res = await fetch(
      `${url.replace(/\/$/, '')}/rest/v1/perfis` +
      `?usuario_id=in.(${unicos.join(',')})&select=usuario_id,apelido`,
      { headers: { apikey: chave, Authorization: `Bearer ${chave}` } },
    );
    if (!res.ok) return new Map();
    const linhas = (await res.json()) as { usuario_id: string; apelido: string | null }[];
    return new Map(linhas.filter((l) => l.apelido).map((l) => [l.usuario_id, l.apelido!]));
  } catch {
    return new Map();
  }
}
```

- [ ] **Passo 2: use nas duas telas**

Nas duas, depois de carregar a lista, chame `apelidosDe` com os `usuarioId` e guarde num estado. Onde hoje se renderiza o nome do autor como texto, passe a renderizar:

```tsx
{apelido ? (
  <Link href={`/comunidade/jogador/?p=${apelido}`} className={estilos.autorLink}>
    {mensagem.autor}
  </Link>
) : (
  mensagem.autor
)}
```

Quem não tem perfil continua sendo texto simples — sem link quebrado, sem "perfil não encontrado".

- [ ] **Passo 3: prove que compila**

Rode: `npx tsc --noEmit && npm run build`
Esperado: sem erro.

- [ ] **Passo 4: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(comunidade): o nome de quem escreveu vira link pro perfil

Uma consulta em lote por listagem, nao uma por avaliacao. Falha vira mapa
vazio: sem apelido o nome fica texto simples, que e' exatamente como esta' hoje.
Perder o link nao pode derrubar a lista.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add componentes/apelidos.ts && git commit -F /tmp/c.txt
git add componentes/AvaliacoesMaterial.tsx && git commit -F /tmp/c.txt
git add app/comunidade/discussoes/discussoes-cliente.tsx && git commit -F /tmp/c.txt
```

---

## Task 14: A quinta aba de moderação

**Arquivos:**
- Criar: `app/comunidade/moderacao/PainelEstante.tsx`
- Modificar: `app/comunidade/moderacao/moderacao-cliente.tsx`

- [ ] **Passo 1: o painel**

`PainelEstante.tsx`, apresentacional puro, no molde exato de `PainelNoticias.tsx`: recebe `motivos`, `erro`, `semServidor`, `aoAprovar`, `aoDescartar`. Cada item mostra o material, quem escreveu e o texto; dois botões, `botao-primario` e `botao-secundario`.

> Use as classes globais `botao-primario`/`botao-secundario`, não `--cor-papel` sobre `--cor-acento-escuro`: aquele token inverte no tema escuro e o contraste quebra.

- [ ] **Passo 2: a aba**

Em `moderacao-cliente.tsx`, acrescente `'estante'` ao tipo `Aba`, o estado, a carga, as ações e a entrada na lista de abas com a contagem de pendentes ao lado — igual às quatro que já existem.

- [ ] **Passo 3: prove que compila**

Rode: `npx tsc --noEmit && npm run build`
Esperado: sem erro.

- [ ] **Passo 4: commit**

```bash
cat > /tmp/c.txt <<'EOF'
feat(moderacao): quinta aba, os motivos da estante

Mais uma fila pro fundador, e o custo e' honesto -- mas deve ficar quase sempre
vazia, porque a maioria vai registrar so' o material e o periodo. Prosa publica
passa por gente; fato entra sozinho.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add app/comunidade/moderacao/PainelEstante.tsx && git commit -F /tmp/c.txt
git add app/comunidade/moderacao/moderacao-cliente.tsx && git commit -F /tmp/c.txt
```

---

## Task 15: As invariantes, e publicar

**Arquivos:**
- Modificar: `testes/rodar.ts`

- [ ] **Passo 1: escreva as asserções que leem o código**

Estas leem o CÓDIGO, não o resultado: são regras que quebram em silêncio, do mesmo jeito que as do colhedor de notícias.

```ts
/* ───────── perfil publico: invariantes ───────── */
const telaJogador = readFileSync('app/comunidade/jogador/jogador-cliente.tsx', 'utf8');

/* A mais importante das cinco: motivo pendente nao pode vazar pra terceiro. */
afirma(/motivoVisivel\(/.test(telaJogador) && !/\.motivo\b(?!Visivel|Status)/.test(telaJogador),
  'a tela publica esta lendo `.motivo` direto: motivo pendente vaza pra quem nao escreveu');

const migracao = readFileSync('supabase/015-estante.sql', 'utf8');
afirma(/for insert to authenticated[\s\S]{0,160}status = 'pendente'/.test(migracao),
  'o insert de motivo nao exige status pendente: o dono publica o proprio texto pelo POST');
afirma(!/on public\.estante_motivos for update to authenticated\s*\n\s*using \(usuario_id/.test(migracao),
  'o dono ganhou update em estante_motivos: com isso ele aprova o proprio motivo');

const edicao = readFileSync('app/comunidade/perfil/perfil-cliente.tsx', 'utf8');
afirma(/jogador\/\?p=/.test(edicao),
  'o cracha continua prometendo "e' assim que voce aparece" sem levar a lugar nenhum');

const repoPerfil = readFileSync('src/logica/perfil.ts', 'utf8');
afirma(/p\.apelido \?\? apelidoDe\(/.test(repoPerfil),
  'o apelido esta sendo regerado a cada gravacao: trocar de nome move o endereco e mata os links');
```

- [ ] **Passo 2: rode a suíte inteira**

Rode: `npx tsx testes/rodar.ts`
Esperado: todas passam.

- [ ] **Passo 3: prove por mutação que elas pegam**

Quebre uma de propósito — troque `motivoVisivel(e, souODono)` por `e.motivo` na tela pública — e rode de novo.
Esperado: **exatamente** a asserção do vazamento falha. Desfaça.

- [ ] **Passo 4: build e publicação**

```bash
npx tsc --noEmit
npx tsx testes/rodar.ts
npm run build
```
Esperado: sem erro de tipo, todas as asserções passando, `✓ Compiled successfully` com `/comunidade/jogador` na lista.

- [ ] **Passo 5: commit e push**

```bash
cat > /tmp/c.txt <<'EOF'
test(perfil): as invariantes que quebram em silencio

Leem o codigo, nao o resultado: motivo pendente vazando, insert sem status
pendente, dono com update no proprio motivo, cracha sem destino, e apelido
sendo regerado a cada gravacao. Nenhuma dessas aparece na tela quando quebra --
aparece meses depois, como link morto ou texto publicado sem revisao.

Conferido por mutacao: trocar motivoVisivel por .motivo derruba exatamente a
asercao do vazamento.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
git add testes/rodar.ts && git commit -F /tmp/c.txt
git push
```

- [ ] **Passo 6: rode as duas migrações em produção**

No Supabase, SQL Editor, **nesta ordem**: `supabase/014-perfil-publico.sql`, depois `supabase/015-estante.sql`.

Depois confira que os avisos do Advisor não voltaram: Database → Advisors → Security. Esperado: nenhum aviso novo sobre `estante` ou `estante_motivos`.

---

## Ordem de execução e dependências

```
1 apelido ─┐
           ├─> 3 Perfil estendido ─> 12 tela de edicao ─┐
2 mig 014 ─┘                                            │
                                                        ├─> 15 invariantes
4 estante puro ─> 5 mig 015 ─> 6 repositorio ─> 14 moderacao
                                     │                  │
7 atividade ─┐                       │                  │
8 procedencia ├─> 11 tela publica <──┘                  │
9 resolveu   ─┤        ^                                │
10 RaqueteRetrato ─────┘                                │
                                                        │
13 nome vira link ──────────────────────────────────────┘
```

As tarefas 1, 4, 7, 8, 9 e 10 não dependem umas das outras e podem ser feitas em qualquer ordem. A 11 precisa de todas elas. A 15 é a última.
