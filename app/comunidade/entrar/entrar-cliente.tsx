/**
 * WikiPong · Entrar ou criar conta — a tela de cadastro (spec 2026-08-15)
 * ------------------------------------------------------------------------------
 * DUAS PORTAS, decisão do fundador, e nenhuma delas é a "certa":
 *
 *   senha            entra na hora, sem depender de e-mail chegar
 *   link no e-mail   não tem senha pra esquecer
 *
 * O QUE ESTA TELA NUNCA FAZ: dizer se um e-mail tem conta ou não. Na entrada,
 * e-mail errado e senha errada dão a MESMA frase; na recuperação, a resposta é
 * "olhe sua caixa" existindo conta ou não. Separar os dois casos entregaria a
 * lista de quem participa a quem estivesse fuçando.
 *
 * O MODO VIVE NA URL (D-12): `?modo=criar`, `?modo=link`, `?modo=esqueci`.
 * Não é preciosismo — é o que faz "criar conta" ser um endereço que dá pra
 * mandar pra alguém, e o botão voltar do navegador funcionar entre as portas.
 *
 * A PORTEIRA: quem termina de entrar e ainda não tem perfil vai pras
 * boas-vindas, não pro site. É a única parte do fluxo que decide por alguém, e
 * ela só decide UMA vez — as boas-vindas inteiras são puláveis.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  pedirLink, criarConta, entrarComSenha, pedirRecuperacao,
  caminhoInterno, SENHA_MINIMA,
} from '@/src/logica/sessao';
import { repositorioPerfilAtual, temIdentidade } from '@/src/logica/perfil';
import { usarSessao } from '@/componentes/usarSessao';
import estilos from './entrar.module.css';

type Modo = 'entrar' | 'criar' | 'link' | 'esqueci';
const MODOS: readonly Modo[] = ['entrar', 'criar', 'link', 'esqueci'];
const modoDa = (v: string | null): Modo =>
  MODOS.includes(v as Modo) ? (v as Modo) : 'entrar';

export function EntrarCliente() {
  const router = useRouter();
  const parametros = useSearchParams();
  const modo = modoDa(parametros.get('modo'));
  /* `caminhoInterno` fecha o redirecionamento aberto — ver o porquê lá, em
     `src/logica/sessao.ts`, junto com o teste que guarda a regra. */
  const volta = caminhoInterno(parametros.get('volta'));
  const { usuario, carregando, disponivel } = usarSessao();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [estado, setEstado] = useState<'parado' | 'enviando' | 'erro'>('parado');
  const [erro, setErro] = useState('');
  /* Duas telas de "deu certo, agora vá no seu e-mail" — a de link e a de
     cadastro com confirmação. O texto muda, a forma não. */
  const [naCaixa, setNaCaixa] = useState<'link' | 'cadastro' | 'recuperacao' | null>(null);

  /**
   * A porteira. Roda quando alguém chega já logado (inclusive voltando do link
   * no e-mail, que devolve a pessoa aqui) e também logo depois do login por
   * senha, chamada à mão — `usarSessao` só pergunta uma vez, na montagem.
   */
  const seguir = useCallback(async () => {
    const repo = await repositorioPerfilAtual();
    const perfil = await repo.ler();
    router.replace(temIdentidade(perfil) ? volta : '/comunidade/boas-vindas/');
  }, [router, volta]);

  useEffect(() => {
    if (carregando || !usuario) return;
    void seguir();
  }, [carregando, usuario, seguir]);

  /* Trocar de porta zera o erro: mensagem de "senha não confere" pendurada na
     tela de criar conta acusa a pessoa de um erro que ela não cometeu ali. */
  const irPara = (m: Modo) => {
    const p = new URLSearchParams();
    if (m !== 'entrar') p.set('modo', m);
    if (parametros.get('volta')) p.set('volta', parametros.get('volta')!);
    const qs = p.toString();
    window.history.pushState(null, '', qs ? `?${qs}` : window.location.pathname);
    setEstado('parado');
    setErro('');
    setNaCaixa(null);
  };

  if (!disponivel) {
    return (
      <div className={estilos.quadro}>
        <h1 className={estilos.titulo}>Conta</h1>
        <p className={estilos.explica}>
          O login depende do servidor, que ainda não está ligado. Enquanto isso o site funciona
          inteiro sem conta — o que você preencher fica guardado neste navegador.
        </p>
        <Link href="/comunidade/perfil/" className="botao-secundario">
          Ir para o perfil
        </Link>
      </div>
    );
  }

  /* Logado (ou ainda perguntando): a porteira está a caminho. Pintar o
     formulário aqui faria a tela piscar "entre" pra quem já entrou. */
  if (carregando || usuario) {
    return (
      <div className={estilos.quadro}>
        <p className={estilos.carregando}>Entrando…</p>
      </div>
    );
  }

  if (naCaixa) {
    const texto = {
      link: 'Se houver conta para este e-mail, o link de entrada chegou. Ele vale por pouco tempo e só funciona uma vez.',
      cadastro:
        'Sua conta foi criada e falta um passo: clique no link que enviamos pra confirmar o e-mail. Sem isso a senha ainda não entra.',
      recuperacao:
        'Se houver conta para este e-mail, o link pra definir uma senha nova chegou. Ele vale por pouco tempo.',
    }[naCaixa];

    return (
      <div className={estilos.quadro}>
        <h1 className={estilos.titulo}>Olhe a sua caixa de entrada.</h1>
        <p className={estilos.explica}>{texto}</p>
        <p className={estilos.explica}>
          Enviamos para <strong>{email}</strong>. Se não aparecer em alguns minutos, confira o
          spam — e confira se o endereço está escrito certo.
        </p>
        <div className={estilos.acoes}>
          <button type="button" className="botao-secundario" onClick={() => irPara(modo)}>
            Usar outro e-mail
          </button>
        </div>
      </div>
    );
  }

  const pedindoSenha = modo === 'entrar' || modo === 'criar';

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setErro('Falta o e-mail.');
      setEstado('erro');
      return;
    }
    if (pedindoSenha && senha.length < SENHA_MINIMA) {
      setErro(`A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`);
      setEstado('erro');
      return;
    }

    setEstado('enviando');
    const aqui = window.location.origin + window.location.pathname;
    try {
      if (modo === 'entrar') {
        await entrarComSenha(email.trim(), senha);
        await seguir();
        return;
      }
      if (modo === 'criar') {
        const r = await criarConta(email.trim(), senha, aqui);
        if (r === 'entrou') {
          await seguir();
          return;
        }
        setNaCaixa('cadastro');
        return;
      }
      if (modo === 'link') {
        /* Volta pra ESTA tela: é aqui que a porteira mora. Este endereço
           precisa estar na lista de permitidas do projeto (Authentication →
           URL Configuration), senão o link chega e devolve noutro lugar. */
        await pedirLink(email.trim(), aqui);
        setNaCaixa('link');
        return;
      }
      await pedirRecuperacao(
        email.trim(),
        `${window.location.origin}/comunidade/nova-senha/`,
      );
      setNaCaixa('recuperacao');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra continuar agora.');
      setEstado('erro');
    }
  };

  return (
    <div className={estilos.quadro}>
      {modo === 'esqueci' ? (
        <>
          <h1 className={estilos.titulo}>Definir uma senha nova</h1>
          <p className={estilos.explica}>
            Digite seu e-mail e mandamos um link pra você escolher outra senha. Serve também
            pra quem sempre entrou pelo link e agora quer ter senha — a conta é a mesma.
          </p>
        </>
      ) : modo === 'link' ? (
        <>
          <h1 className={estilos.titulo}>Entrar por link no e-mail</h1>
          <p className={estilos.explica}>
            Sem senha: o link que chega na sua caixa é a prova de que a conta é sua. Se ainda
            não houver conta com esse e-mail, ela é criada quando você clicar.
          </p>
        </>
      ) : (
        <>
          <h1 className={estilos.titulo}>Sua conta no WikiPong</h1>
          <p className={estilos.explica}>
            A conta guarda o seu perfil, a sua estante e as suas avaliações — e leva tudo pra
            qualquer aparelho. <strong>Não é obrigatória:</strong> o site inteiro funciona sem
            entrar, só que o que você preencher fica preso neste navegador.
          </p>

          {/* Duas portas de tamanho igual, de propósito. Uma delas em destaque
              faria a outra parecer um remendo — e não é: são escolhas com
              custos diferentes, não uma boa e uma tolerada. */}
          <div className={estilos.alternador} role="tablist" aria-label="Como entrar">
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'entrar'}
              className={modo === 'entrar' ? estilos.abaAtiva : estilos.aba}
              onClick={() => irPara('entrar')}
            >
              Já tenho conta
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'criar'}
              className={modo === 'criar' ? estilos.abaAtiva : estilos.aba}
              onClick={() => irPara('criar')}
            >
              Criar conta
            </button>
          </div>
        </>
      )}

      <form className={estilos.form} noValidate onSubmit={enviar}>
        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Seu e-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            autoComplete="email"
            autoFocus
            aria-invalid={estado === 'erro'}
          />
        </label>

        {pedindoSenha && (
          <label className={estilos.campo}>
            <span className={estilos.rotulo}>
              {modo === 'criar' ? 'Escolha uma senha' : 'Sua senha'}
            </span>
            <span className={estilos.comBotao}>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                aria-invalid={estado === 'erro'}
              />
              <button
                type="button"
                className={estilos.verSenha}
                onClick={() => setMostrarSenha((v) => !v)}
                aria-pressed={mostrarSenha}
              >
                {mostrarSenha ? 'ocultar' : 'ver'}
              </button>
            </span>
            {modo === 'criar' && (
              <span className={estilos.regra}>
                Pelo menos {SENHA_MINIMA} caracteres. Não há outra exigência — nada de símbolo
                obrigatório nem de letra maiúscula. Se o servidor pedir mais, ele diz quanto.
              </span>
            )}
          </label>
        )}

        {estado === 'erro' && (
          <p className={estilos.erro} role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="botao-primario" disabled={estado === 'enviando'}>
          {estado === 'enviando'
            ? 'Um instante…'
            : modo === 'criar'
              ? 'Criar minha conta'
              : modo === 'link'
                ? 'Receber link de entrada'
                : modo === 'esqueci'
                  ? 'Mandar o link'
                  : 'Entrar'}
        </button>
      </form>

      {/* ── As saídas laterais. Sempre visíveis: quem travou numa porta precisa
             enxergar a outra sem ter que voltar. ── */}
      <div className={estilos.saidas}>
        {modo === 'entrar' && (
          <>
            <button type="button" className={estilos.saida} onClick={() => irPara('esqueci')}>
              Esqueci minha senha
            </button>
            <button type="button" className={estilos.saida} onClick={() => irPara('link')}>
              Prefiro receber um link no e-mail
            </button>
          </>
        )}
        {modo === 'criar' && (
          <button type="button" className={estilos.saida} onClick={() => irPara('link')}>
            Criar conta sem senha, por link no e-mail
          </button>
        )}
        {(modo === 'link' || modo === 'esqueci') && (
          <button type="button" className={estilos.saida} onClick={() => irPara('entrar')}>
            ← voltar pra entrada com senha
          </button>
        )}
      </div>

      <p className={estilos.rodape}>
        Guardamos o seu e-mail pra identificar a conta e nada além disso. Sem conta, o site
        continua inteiro — <Link href="/comunidade/perfil/">dá pra preencher o perfil sem
        entrar</Link>, ele só não te acompanha.
      </p>
    </div>
  );
}
