/**
 * WikiPong · Boas-vindas — o perfil sendo montado pela primeira vez
 * ------------------------------------------------------------------------------
 * POR QUE EM PASSOS, e não um formulário só: a tela de perfil pede oito coisas
 * de uma vez, e formulário longo é formulário abandonado. Em passos, cada tela
 * pede uma coisa e explica pra que ela serve — que é o único jeito honesto de
 * pedir dado a alguém que acabou de chegar.
 *
 * TRÊS REGRAS QUE NÃO PODEM ESCAPAR DAQUI:
 *
 * 1. GRAVA A CADA PASSO. Ninguém perde três telas porque a quarta falhou.
 * 2. DÁ PRA PULAR, sempre e de qualquer passo. Boas-vindas que prendem viram
 *    desistência, e o site inteiro já funciona sem perfil nenhum.
 * 3. O APELIDO CONTINUA SENDO GERADO SOZINHO, a partir do nome. Ter tela de
 *    cadastro não mudou o custo de pedir apelido à mão — disponibilidade, nomes
 *    reservados, a primeira pessoa levando os nomes bons.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  repositorioPerfilAtual, perfilVazio, temIdentidade,
  MAOS, EMPUNHADURAS, ROTULO_MAO, ROTULO_EMPUNHADURA,
  type Perfil, type RepositorioPerfil, type Mao, type Empunhadura,
} from '@/src/logica/perfil';
import { ROTULO_ESTILO, NIVEIS, type EstiloJogador, type NivelJogador } from '@/src/logica/avaliacoes';
import { MATERIAIS, materialPorId } from '@/componentes/dados-materiais';
import { SeletorMaterial } from '@/componentes/SeletorMaterial';
import { usarSessao } from '@/componentes/usarSessao';
import { Login } from '@/componentes/Login';
import { caminhoDoPerfil } from '@/componentes/apelidos';
import estilos from './boas-vindas.module.css';

const ESTILOS: readonly EstiloJogador[] = ['atacante', 'allround', 'defensor'];

type Passo = {
  id: string;
  titulo: string;
  porque: string;
  /** Um passo "pronto" já pode avançar; nenhum é obrigatório. */
  pronto: (p: Perfil) => boolean;
};

/* A ordem é do mais fácil pro mais específico: quem já respondeu duas coisas
   responde a terceira. Começar pela raquete afugentaria o iniciante, que é
   justamente quem mais precisa de perfil. */
const PASSOS: readonly Passo[] = [
  {
    id: 'nome',
    titulo: 'Como você assina',
    porque: 'É o nome que aparece embaixo de cada avaliação e resposta sua. Pode ser apelido.',
    pronto: (p) => p.nome.trim().length >= 2,
  },
  {
    id: 'jogo',
    titulo: 'Como você joga',
    porque:
      'Estilo e nível viram a tag embaixo do seu nome. É o que faz a sua nota significar alguma coisa pra quem lê: “rápida demais” de um defensor não quer dizer o mesmo que de um atacante.',
    pronto: (p) => Boolean(p.estilo),
  },
  {
    id: 'maos',
    titulo: 'Mão e empunhadura',
    porque:
      'Muda a recomendação inteira. Uma borracha que é ótima na caneta chinesa pode não fazer sentido na clássica.',
    pronto: (p) => Boolean(p.mao),
  },
  {
    id: 'raquete',
    titulo: 'Sua raquete',
    porque:
      'Vira o retrato do seu perfil, e é o que deixa outra pessoa comparar o equipamento dela com o seu. Dá pra preencher só o que você souber.',
    pronto: (p) => Boolean(p.equipamento.lamina || p.equipamento.fh || p.equipamento.bh),
  },
];

export function BoasVindasCliente() {
  const { usuario, carregando, disponivel } = usarSessao();
  const [repo, setRepo] = useState<RepositorioPerfil | null>(null);
  const [perfil, setPerfil] = useState<Perfil>(perfilVazio());
  const [passo, setPasso] = useState(0);
  const [gravando, setGravando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    repositorioPerfilAtual().then(async (r) => {
      if (!vivo) return;
      setRepo(r);
      setPerfil(await r.ler());
    });
    return () => { vivo = false; };
  }, [usuario]);

  /* Grava a cada passo: ninguem perde tres telas porque a quarta falhou. */
  const salvar = async (mudanca: Partial<Perfil>) => {
    const novo = { ...perfil, ...mudanca };
    setPerfil(novo);
    if (!repo) return;
    setGravando(true);
    try {
      await repo.gravar(novo);
      setErro(null);
    } catch {
      setErro('Não consegui guardar agora. O que você digitou continua na tela — tente avançar de novo.');
    } finally {
      setGravando(false);
    }
  };

  const laminas = useMemo(() => MATERIAIS.filter((m) => m.tipo === 'Lâmina'), []);
  const borrachas = useMemo(() => MATERIAIS.filter((m) => m.tipo === 'Borracha'), []);

  if (carregando) return <p className={estilos.carregando}>Carregando…</p>;

  /* Sem login, boas-vindas não fazem sentido: o perfil não teria dono e ficaria
     preso neste navegador. A tela diz isso e oferece a entrada. */
  if (disponivel && !usuario) {
    return (
      <div className={estilos.quadro}>
        <Login
          titulo="Primeiro, entre"
          explicacao="Seu perfil precisa de dono pra te acompanhar em qualquer aparelho. Entrar leva um clique: a gente manda um link no seu e-mail."
        />
      </div>
    );
  }

  const atual = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  const terminar = (
    <div className={estilos.fim}>
      <h1 className={estilos.titulo}>Pronto.</h1>
      <p className={estilos.explica}>
        Seu perfil está de pé. Ele cresce sozinho conforme você usa o site: cada avaliação que
        escrever e cada dúvida que resolver aparecem nele.
      </p>
      <div className={estilos.acoes}>
        {perfil.apelido && (
          <Link href={caminhoDoPerfil(perfil.apelido)} className="botao-primario">
            Ver meu perfil
          </Link>
        )}
        <Link href="/comunidade/perfil/" className="botao-secundario">
          Continuar preenchendo
        </Link>
      </div>
    </div>
  );

  if (passo >= PASSOS.length) return <div className={estilos.quadro}>{terminar}</div>;

  return (
    <div className={estilos.quadro}>
      {/* Progresso como texto, não só como barra: "passo 2 de 4" diz quanto
          falta sem obrigar ninguém a medir um traço com o olho. */}
      <p className={`mono ${estilos.progresso}`}>
        passo {passo + 1} de {PASSOS.length}
      </p>
      <ol className={estilos.trilha} aria-hidden="true">
        {PASSOS.map((p, i) => (
          <li key={p.id} className={i <= passo ? estilos.trechoFeito : estilos.trecho} />
        ))}
      </ol>

      <h1 className={estilos.titulo}>{atual.titulo}</h1>
      <p className={estilos.explica}>{atual.porque}</p>

      <div className={estilos.campos}>
        {atual.id === 'nome' && (
          <label className={estilos.campo}>
            <span className={estilos.rotulo}>Seu nome ou apelido</span>
            <input
              type="text"
              autoFocus
              value={perfil.nome}
              onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
              onBlur={() => salvar({ nome: perfil.nome })}
              placeholder="como você quer ser chamado"
            />
          </label>
        )}

        {atual.id === 'jogo' && (
          <>
            <fieldset className={estilos.escolhas}>
              <legend className={estilos.rotulo}>Seu estilo</legend>
              {ESTILOS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={perfil.estilo === e ? estilos.escolhaAtiva : estilos.escolha}
                  aria-pressed={perfil.estilo === e}
                  onClick={() => salvar({ estilo: e })}
                >
                  {ROTULO_ESTILO[e]}
                </button>
              ))}
            </fieldset>
            <fieldset className={estilos.escolhas}>
              <legend className={estilos.rotulo}>Seu nível</legend>
              {NIVEIS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={perfil.nivel === n ? estilos.escolhaAtiva : estilos.escolha}
                  aria-pressed={perfil.nivel === n}
                  onClick={() => salvar({ nivel: n as NivelJogador })}
                >
                  {n}
                </button>
              ))}
            </fieldset>
          </>
        )}

        {atual.id === 'maos' && (
          <>
            <fieldset className={estilos.escolhas}>
              <legend className={estilos.rotulo}>Você joga com qual mão</legend>
              {MAOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={perfil.mao === m ? estilos.escolhaAtiva : estilos.escolha}
                  aria-pressed={perfil.mao === m}
                  onClick={() => salvar({ mao: m as Mao })}
                >
                  {ROTULO_MAO[m]}
                </button>
              ))}
            </fieldset>
            <fieldset className={estilos.escolhas}>
              <legend className={estilos.rotulo}>Empunhadura</legend>
              {EMPUNHADURAS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={perfil.empunhadura === e ? estilos.escolhaAtiva : estilos.escolha}
                  aria-pressed={perfil.empunhadura === e}
                  onClick={() => salvar({ empunhadura: e as Empunhadura })}
                >
                  {ROTULO_EMPUNHADURA[e]}
                </button>
              ))}
            </fieldset>
          </>
        )}

        {atual.id === 'raquete' && (
          <>
            <EscolhaDeMaterial
              rotulo="Lâmina"
              lista={laminas}
              valor={perfil.equipamento.lamina}
              aoEscolher={(id) => salvar({ equipamento: { ...perfil.equipamento, lamina: id } })}
            />
            <EscolhaDeMaterial
              rotulo="Borracha do forehand"
              lista={borrachas}
              valor={perfil.equipamento.fh}
              aoEscolher={(id) => salvar({ equipamento: { ...perfil.equipamento, fh: id } })}
            />
            <EscolhaDeMaterial
              rotulo="Borracha do backhand"
              lista={borrachas}
              valor={perfil.equipamento.bh}
              aoEscolher={(id) => salvar({ equipamento: { ...perfil.equipamento, bh: id } })}
            />
            <p className={estilos.dica}>
              Não sabe o que você tem? <Link href="/catalogo/">Procure no catálogo</Link> — dá pra
              voltar aqui depois.
            </p>
          </>
        )}
      </div>

      {erro && <p className={estilos.erro}>{erro}</p>}

      <div className={estilos.acoes}>
        <button
          type="button"
          className="botao-primario"
          disabled={gravando}
          onClick={async () => {
            /* O nome é gravado no blur, mas quem clica direto no botão sem sair
               do campo pularia a gravação. Este await fecha esse buraco. */
            if (atual.id === 'nome') await salvar({ nome: perfil.nome });
            setPasso(passo + 1);
          }}
        >
          {ultimo ? 'Terminar' : 'Continuar'}
        </button>

        {/* Pular existe em TODO passo, de propósito. */}
        <button
          type="button"
          className={estilos.pular}
          onClick={() => setPasso(ultimo ? PASSOS.length : passo + 1)}
        >
          {ultimo ? 'Deixar pra depois' : 'Pular este'}
        </button>
      </div>

      {passo > 0 && (
        <button type="button" className={estilos.voltar} onClick={() => setPasso(passo - 1)}>
          ← voltar
        </button>
      )}

      {temIdentidade(perfil) && (
        <p className={estilos.jaDa}>
          Já dá pra usar: você tem nome e estilo. O resto é ganho, não obrigação.
        </p>
      )}
    </div>
  );
}

/**
 * Antes era um `<select>` nativo com as 549 lâminas dentro. Sem busca, o select
 * só pula pra primeira letra digitada — e como quase todo nome do catálogo
 * começa pela marca, "Hayabusa" nunca é a primeira letra de nada. Achar a sua
 * lâmina virava rolar centenas de linhas, no passo em que a pessoa está há
 * menos de um minuto no site.
 *
 * O `SeletorMaterial` de verdade já existia (busca, foto, preço, combobox ARIA
 * completo). Aqui ele só ganha um jeito de DESFAZER: nas boas-vindas, escolher
 * errado sem poder voltar atrás é pior que não escolher.
 */
function EscolhaDeMaterial({
  rotulo,
  lista,
  valor,
  aoEscolher,
}: {
  rotulo: string;
  lista: typeof MATERIAIS;
  valor?: string;
  aoEscolher: (id: string | undefined) => void;
}) {
  const escolhido = valor ? materialPorId(valor) : undefined;
  return (
    <div className={estilos.campo}>
      <SeletorMaterial
        rotulo={rotulo}
        opcoes={lista}
        valor={escolhido}
        aoEscolher={(id) => aoEscolher(id)}
        placeholder="buscar por nome ou marca — ou deixar em branco"
      />
      {escolhido && (
        <button type="button" className={estilos.pular} onClick={() => aoEscolher(undefined)}>
          não sei, deixar em branco
        </button>
      )}
    </div>
  );
}
