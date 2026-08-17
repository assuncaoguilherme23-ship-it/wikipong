# WikiPong — briefing para discussão de design

> **Para que serve este arquivo:** dar contexto completo a alguém (ou a um Claude)
> que nunca viu o projeto, para conversar sobre design, produto e ideias sem
> precisar abrir o código. Não é documentação técnica — para isso existem o
> `CLAUDE.md` (convenções), o `DECISOES.md` (o ADR, que é a lei) e o `DESIGN.md`
> (sistema visual).
>
> **Estado:** 2026-08-04. Site no ar em `www.wikipong.com`.

---

## 1. O que é

Enciclopédia **em português** de equipamentos de tênis de mesa. Fundador:
Guilherme, dev solo, que também gere uma academia (FitPong).

**A tese:** quem começa no tênis de mesa não encontra informação confiável em
português. As lojas publicam o número que a marca usa para vender; os fóruns
publicam opinião solta; e ninguém explica o que os números significam. O
WikiPong existe para explicar — a frase da marca é *"Feito pra explicar, não pra
empurrar"*.

**Modelo de negócio: em aberto de propósito.** A ordem de preferência hoje é
afiliado/parceria com lojas, depois curso pago. Nenhuma copy pode prometer "não
vendemos nada", porque isso fecharia a porta de afiliado.

**Stack:** Next.js App Router com **export estático** (`output: 'export'`), dados
em JSON no repositório, deploy na Vercel. Comunidade (avaliações e discussões)
roda em Supabase com RLS. Tudo em PT-BR: nomes de arquivo, funções, variáveis,
comentários e commits.

---

## 2. As cinco leis que restringem qualquer decisão de design

Estas não são preferências — são decisões registradas, e valem mais que a
estética. Quem for propor design precisa conhecê-las.

**1. Fato e opinião não se misturam (D-14).** A ordem das seções na ficha do
material é declaração editorial: ficha técnica (fato) → "Em português claro"
(tradução) → onde comprar (ação) → comunidade (opinião, rotulada, por último).
Essa ordem é inviolável.

**2. O que não existe não aparece (D-16).** Nada de link morto, "em breve"
clicável, preço sem fonte, nota inventada ou gráfico com zero no lugar de dado
ausente. Quando falta dado, a seção **some** em vez de mostrar vazio. Esta é a
regra que mais molda a interface.

**3. A procedência é obrigatória.** Todo número diz de onde veio: escala nossa,
ficha do fabricante (com link e data) ou comunidade externa (com amostra). Duas
coisas nunca se confundem: o que a marca publica e o que nós derivamos.

**4. Estado navegável vive na URL (D-12).** Filtro, comparação, modo de exibição
e resultado do quiz são compartilháveis e sobrevivem ao refresh.

**5. Acessibilidade não é etapa final.** `prefers-reduced-motion` respeitado,
contraste AA nos dois temas (o site tem tema escuro), foco visível, navegação por
teclado. Todo gráfico tem alternativa textual.

### Anti-referências declaradas

O que o site **não** pode parecer: *SaaS genérico de IA* (gradiente decorativo,
glassmorphism, hero-metric, grid de cards idênticos), *loja que empurra*
(urgência, promoção, compre-agora) e *review site caótico*.

---

## 3. O que existe hoje

### Números reais (2026-08-04)

| | |
|---|---|
| Materiais no catálogo | **678** — 393 lâminas, 282 borrachas, 2 raquetes montadas, 1 bola |
| Marcas | 15 |
| Páginas geradas no build | 722 |
| Guias do "Aprender" | 11 |
| Verbetes de glossário | 33, em 5 categorias |
| Profissionais com setup | 5 |
| Notícias | 10 (fonte: CBTM) |
| Módulos de lógica pura | 16 |
| Asserções de teste | 358 |

### As telas

**`/` (home)** — hero, prova ao vivo (dois materiais comparados com radar e
tabela), prateleira de iniciantes, grade de features.

**`/catalogo`** — 678 materiais, filtros facetados na lateral, busca, ordenação,
seleção de até 2 para comparar. Tem **modo Simples ↔ Técnico**.

**`/materiais/[id]`** — a ficha. É a tela mais densa e a mais discutível. Ver
seção 4.

**`/comparar`** — dois materiais lado a lado, radar sobreposto e tabela. Só do
mesmo tipo (borracha com borracha, lâmina com lâmina) — regra de produto, não
limitação técnica.

**`/montar`** — configurador de raquete: uma lâmina e duas borrachas, com preço
somando ao vivo e observações sobre a combinação.

**`/quiz`** — 43 caminhos possíveis, 8 perfis de resultado. Cada resposta vira
filtro real na URL do catálogo.

**`/aprender`** e **`/glossario`** — conteúdo educativo.

**`/comunidade`** — avaliações estruturadas (nota + texto + nível + tempo de uso
+ estilo de jogo), discussões, perfil. Login opcional, por link mágico.
Pré-moderação: tudo entra pendente.

**`/profissionais`**, **`/noticias`**, **`/marcas`**, **`/conjuntos`**,
**`/escalas`** (tradutor de durezas entre réguas de marcas).

---

## 4. A ficha do material — onde o design mais importa

É a tela que recebe tráfego de busca e a que mais precisa de discussão. Hoje ela
tem, nesta ordem:

1. **Cabeçalho** — foto oficial do produto, nome, marca, tipo, nível, preço
2. **Ficha unificada** — velocidade, efeito, controle, durabilidade em escala
   0–10 nossa, com número e palavra lado a lado; mais o radar
3. **O que cada número mede** — uma frase por índice
4. **O que o fabricante publica** — a ficha da marca, verbatim, com fonte e data
5. **Em português claro** — a construção declarada, traduzida
6. **Onde este material cai no catálogo** — régua de posição
7. **Parecidos com este** — três alternativas com nome, número e preço
8. **Pra quem é** — os perfis do quiz rodados contra este material
9. **Quem usa** — profissionais, quando houver
10. **Onde comprar** — ofertas reais com preço, loja e data
11. **Comunidade** — avaliações e discussões

### Os três gráficos, e por que são três

| gráfico | responde | aparece em |
|---|---|---|
| Régua do catálogo | *8,2 é muito?* | 673 de 678 |
| Radar × mediana | *qual é o formato desta peça?* | 112 |
| Parecidos com este | *e o que mais existe parecido?* | 677 |

O radar sozinho atendia 114 materiais e **nenhuma das 393 lâminas** — ele precisa
de 3 eixos e lâmina só tem velocidade e controle. Foi por isso que a régua e os
parecidos existem: eles funcionam com um índice só.

---

## 5. A restrição que define tudo: o dado é desigual

Este é o ponto mais importante para qualquer conversa de design. **A maior parte
do catálogo não tem os números que a interface gostaria de mostrar.**

| dado | quantos materiais têm |
|---|---|
| Preço real de loja | 678 |
| Ficha do fabricante | 678 |
| Construção/superfície traduzível | 649 |
| Velocidade e controle | 208 |
| Efeito e durabilidade | 114 |
| Dureza declarada em graus | 100 |
| Fibra interna × externa declarada | 34 |
| Índice "Arco" publicado pela marca | 15 |

Consequências práticas:

- Qualquer componente que **exija** specs atende no máximo 31% do catálogo.
- Qualquer componente baseado em **preço ou ficha** atende quase 100%.
- Gráfico que precisa de 3 eixos exclui todas as lâminas.

Isso já derrubou uma métrica: o **"Perdão"** era o quarto índice e o diferencial
anunciado na home — *"a métrica que o iniciante precisa e nenhum fabricante
publica"*. Medido, ele aparecia em **10 materiais de 678**, e era um composto de
pesos nossos nunca calibrados. Saiu em 2026-08-03; a **durabilidade** assumiu o
lugar.

---

## 6. Sistema visual

**Identidade:** "Verde-mesa". Archivo (display) + Inter (corpo) + JetBrains Mono
(dados, números, rótulos, metadados — a "voz dos dados").

**Regras nomeadas:** Regra do Acento, da Mesa, da Voz de Dados, do Plano.

**Uso do acento (contraste):** texto acentuado usa o alias `--cor-texto-acento`;
fundos de botão usam `--cor-acento-escuro`. O acento claro só entra em
preenchimento, borda, anel de foco, wordmark — e em texto grande (≥24px).

**Don'ts documentados que já pegaram propostas minhas:** nada de *side-stripe*
(borda lateral colorida >1px em card), nada de sublinhado tracejado sob texto,
nada de gradiente decorativo.

**A fonte da verdade visual é o site publicado** (D-21, 2026-08-16). O Figma v2 foi
o andaime que deu a identidade e virou registro histórico: coisa nova se desenha a
partir do que já está no ar. Melhorias podem ser aplicadas direto; divergências
significativas ficam registradas em nota de decisão.

---

## 7. Decisões de design tomadas recentemente, com o motivo

Úteis porque mostram o critério em ação:

**O modo Técnico virou uma linha por métrica.** Era grade de 4 colunas iguais num
cartão de ~213px: "VELOCIDADE" precisa de ~70px e sobravam ~52px, então a palavra
vazava para fora do cartão. Agora rótulo à esquerda, número à direita.

**A barra de ação do `/comparar` é `fixed`, não `sticky`.** Sticky ficaria presa
ao fluxo da seção e continuaria exigindo rolar 678 itens até o fim.

**O radar ganhou a mediana do catálogo por trás.** Um polígono sozinho é forma
sem régua. Com a mediana tracejada atrás, o desenho responde "isto é muito?" sem
texto. É **mediana e não média** porque preço e specs têm cauda longa.

**"Parecidos com este" usa barras, não radar.** Radar com quatro polígonos vira
emaranhado — é o motivo de o comparador aceitar só dois materiais.

**O preço nunca ganha barra nem destaque de "maior".** Barra convida a ler "maior
é melhor", e no preço maior é pior.

**O selo "A validar" saiu do site inteiro** (2026-08-04, decisão do fundador).
Ele prometia um aval de especialista sem data nem responsável, e um aviso
permanente de "isto ainda não vale" em cima de cada número ensina o leitor a não
confiar em nada da página. A **procedência** continua dita em toda tela.

**3D foi recomendado contra.** Profundidade distorce área e ângulo, que são
exatamente o que um radar usa para informar: em perspectiva, o eixo da frente
parece maior que o de trás com o mesmo valor. Fica bonito em print e mente na
leitura.

---

## 8. O que está em aberto — bons assuntos para discutir

**Cadastro e área de conta.** O login por link mágico já funciona e a tabela de
perfis existe, mas **não há indicador de conta no cabeçalho** — quem entra por
outra página não sabe que está logado. A barra foi enxugada de propósito para
abrir espaço. Decisões pendentes: login por senha ou continuar só com link
mágico? Escrever na comunidade vai exigir cadastro (hoje não exige)?

**O papel do especialista.** O selo saiu, mas a ideia de um especialista revisor
continua de pé, sem formato definido. O que ele assinaria? Como isso apareceria
sem virar selo vazio de novo?

**Movimento com propósito.** O radar tem draw-in. A ideia levantada e não
implementada: animar a **transição entre materiais** no comparador (morphing de
forma), que seria movimento carregando informação em vez de decoração.

**Lacunas de acervo, não de design:** só 2 raquetes montadas em 678 materiais (o
quiz tem um caminho que morre vazio por causa disso, e avisa antes); pinos e
anti-spin ainda fora do catálogo por decisão; 15 marcas, sem as marcas menores.

**O catálogo é 100% client-side.** O HTML estático hoje traz 60 materiais reais
(era zero — entregava só "Carregando" ao Google). Os 618 restantes só aparecem
com JS. Renderizar todos custaria 1,6 MB, dos quais 973 KB são payload que o
React descarta ao hidratar.

---

## 9. Como conversar sobre este projeto

Três coisas que economizam tempo:

1. **Pergunte quantos materiais têm o dado antes de propor um componente.** A
   seção 5 existe para isso. Muita ideia boa morre em "só 15 materiais têm".
2. **A honestidade vence a estética aqui.** Uma proposta que preencha a tela com
   número estimado será rejeitada, mesmo bonita. Uma que deixe espaço vazio com
   uma frase explicando por quê está alinhada.
3. **O tom da copy é honesto, didático e técnico** — nunca promocional, nunca
   fofo. O site fala com quem está perdido sem tratá-lo como bobo.
