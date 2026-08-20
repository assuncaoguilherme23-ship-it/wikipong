'use client';

/**
 * Cabeçalho com a arquitetura da D-03 — na medida do que EXISTE (D-16):
 *   · Materiais ▾ (mega-menu): Todos · por tipo (presets de filtro D-12) · Comparar
 *     (Comparar mora DENTRO de Materiais — D-03).
 *   · Aprender ▾: virou grupo em 2026-08-20, como a própria D-03 previa
 *     ("vira grupo quando houver ≥2 filhos"). Glossário e Tradutor de durezas
 *     PRIMEIRO — eles ensinam a ler o resto do site, e estavam enterrados.
 *   · Comunidade ▾: visão geral, discussões, perfil, moderação · e a coluna
 *     Acompanhar (notícias, competições, profissionais, conta).
 *   · Mobile: hambúrguer → drawer verde-mesa com a MESMA arquitetura.
 * O quiz mantém a barra própria minimalista (fluxo de conversão).
 *
 * Escala de z-index (semântica): header 10 · mega 20 · backdrop 30 · drawer 40.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoCompleto } from './Logo';
import { LinkModeracao } from './LinkModeracao';
import { MATERIAIS } from './dados-materiais';
import { slug } from '@/src/logica/filtros';
import estilos from './Cabecalho.module.css';

// Tipos com contagem real, derivados dos dados (só o que tem item aparece — D-16)
const TIPOS = [...new Set(MATERIAIS.map((m) => m.tipo))].map((tipo) => ({
  rotulo: `${tipo}s`,
  href: `/catalogo/?tipo=${slug(tipo)}`,
  contagem: MATERIAIS.filter((m) => m.tipo === tipo).length,
}));

function IconeMenu({ aberto }: { aberto: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      {aberto ? (
        <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M3 5.5h16M3 11h16M3 16.5h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function Cabecalho() {
  const rota = usePathname();
  const [megaAberto, setMegaAberto] = useState(false);
  const [aprenderAberto, setAprenderAberto] = useState(false);
  const [comunidadeAberto, setComunidadeAberto] = useState(false);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const megaRef = useRef<HTMLDivElement | null>(null);
  const aprenderRef = useRef<HTMLDivElement | null>(null);
  const comunidadeRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Navegou → fecha tudo
  useEffect(() => {
    setMegaAberto(false);
    setAprenderAberto(false);
    setComunidadeAberto(false);
    setDrawerAberto(false);
  }, [rota]);

  // Escape fecha; clique fora fecha os menus
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMegaAberto(false);
        setAprenderAberto(false);
        setComunidadeAberto(false);
        setDrawerAberto(false);
      }
    };
    const aoClicar = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (megaRef.current && !megaRef.current.contains(alvo)) setMegaAberto(false);
      if (aprenderRef.current && !aprenderRef.current.contains(alvo)) setAprenderAberto(false);
      if (comunidadeRef.current && !comunidadeRef.current.contains(alvo)) setComunidadeAberto(false);
    };
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoClicar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoClicar);
    };
  }, []);

  // Drawer aberto: trava o scroll do body e foca o painel
  useEffect(() => {
    if (drawerAberto) {
      document.body.style.overflow = 'hidden';
      drawerRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerAberto]);

  const ativo = (href: string) => rota === href || rota === href.replace(/\/$/, '');

  return (
    <>
      <header className={estilos.cabecalho}>
      <div className={`container ${estilos.linha}`}>
        <Link href="/" className={estilos.marca} aria-label="WikiPong, início">
          <LogoCompleto altura={30} />
        </Link>

        {/* ── Desktop ── */}
        <nav className={estilos.nav} aria-label="Principal">
          <div className={estilos.megaEscopo} ref={megaRef}>
            <button
              type="button"
              className={`${estilos.navLink} ${estilos.megaBotao}`}
              aria-expanded={megaAberto}
              aria-controls="painel-materiais"
              /* Abrir um fecha o outro: dois painéis abertos se sobrepõem. */
              onClick={() => {
                setAprenderAberto(false);
                setComunidadeAberto(false);
                setMegaAberto((v) => !v);
              }}
            >
              Materiais
              <svg width="10" height="7" viewBox="0 0 10 7" aria-hidden="true" className={estilos.seta}>
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {megaAberto && (
              <div id="painel-materiais" className={estilos.mega}>
                <div className={estilos.megaColuna}>
                  <p className={`mono ${estilos.megaTitulo}`}>Catálogo</p>
                  <Link href="/catalogo/">Todos os materiais</Link>
                  <Link href="/top-borrachas/">Borrachas do momento</Link>
                  {TIPOS.map((t) => (
                    <Link key={t.href} href={t.href}>
                      {t.rotulo} <span className={`mono ${estilos.megaContagem}`}>{t.contagem}</span>
                    </Link>
                  ))}
                </div>
                <div className={estilos.megaColuna}>
                  <p className={`mono ${estilos.megaTitulo}`}>Ferramentas</p>
                  <Link href="/montar/">Montar minha raquete</Link>
                  <Link href="/conjuntos/">Conjuntos montados</Link>
                  <Link href="/comparar/">Comparar lado a lado</Link>
                  <Link href="/quiz/">Teste de perfil</Link>
                  <Link href="/marcas/">Marcas</Link>
                </div>
              </div>
            )}
          </div>
          {/* ── Aprender ▾ ───────────────────────────────────────────────────
              Era link direto, e o proprio cabecalho ja' previa a virada: "vira
              grupo quando houver ≥2 filhos" (D-03). Sao tres agora — e os dois
              que ensinam a LER o site estavam enterrados: o Glossario so' no
              rodape e no drawer, e o Tradutor de durezas em quinto lugar dentro
              de Materiais ▾ → Ferramentas.

              Eles vem PRIMEIRO no painel, antes dos guias, a pedido do fundador
              (2026-08-20): sao a porta de quem nao entende o vocabulario, e
              porta nao fica no fim do corredor.

              O Tradutor SAIU de Ferramentas em vez de aparecer nos dois lugares:
              link repetido em dois menus e' o comeco de duas arquiteturas. */}
          <div className={estilos.megaEscopo} ref={aprenderRef}>
            <button
              type="button"
              className={`${estilos.navLink} ${estilos.megaBotao}`}
              aria-expanded={aprenderAberto}
              aria-controls="painel-aprender"
              aria-current={
                rota.startsWith('/aprender') ||
                rota.startsWith('/glossario') ||
                rota.startsWith('/escalas')
                  ? 'page'
                  : undefined
              }
              onClick={() => {
                setMegaAberto(false);
                setComunidadeAberto(false);
                setAprenderAberto((v) => !v);
              }}
            >
              Aprender
              <svg width="10" height="7" viewBox="0 0 10 7" aria-hidden="true" className={estilos.seta}>
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {aprenderAberto && (
              <div id="painel-aprender" className={`${estilos.mega} ${estilos.megaEstreito}`}>
                <div className={estilos.megaColuna}>
                  <p className={`mono ${estilos.megaTitulo}`}>Entender o vocabulário</p>
                  <Link href="/glossario/">Glossário</Link>
                  <Link href="/escalas/">Tradutor de durezas</Link>
                </div>
                <div className={estilos.megaColuna}>
                  <p className={`mono ${estilos.megaTitulo}`}>Aprender</p>
                  <Link href="/aprender/">Todos os guias</Link>
                  <Link href="/quiz/">Descobrir meu perfil</Link>
                </div>
              </div>
            )}
          </div>
          {/* ── Comunidade ▾ ──────────────────────────────────────────────────
              Era link direto, e Notícias ocupava um lugar próprio na barra. Mas
              notícia É conteúdo de comunidade, e a página de comunidade já
              listava as mesmas seções numa subnav própria — a barra do topo
              repetia parte e escondia o resto.

              Agora o grupo reúne o que a subnav já reunia. A moderação entra
              pelo LinkModeracao, que some para quem não é admin (arrumação, não
              segurança: quem protege a fila é o RLS). */}
          <div className={estilos.megaEscopo} ref={comunidadeRef}>
            <button
              type="button"
              className={`${estilos.navLink} ${estilos.megaBotao}`}
              aria-expanded={comunidadeAberto}
              aria-controls="painel-comunidade"
              aria-current={rota.startsWith('/comunidade') || rota.startsWith('/noticias') ? 'page' : undefined}
              onClick={() => {
                setMegaAberto(false);
                setAprenderAberto(false);
                setComunidadeAberto((v) => !v);
              }}
            >
              Comunidade
              <svg width="10" height="7" viewBox="0 0 10 7" aria-hidden="true" className={estilos.seta}>
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {comunidadeAberto && (
              <div id="painel-comunidade" className={`${estilos.mega} ${estilos.megaEstreito}`}>
                <div className={estilos.megaColuna}>
                  <p className={`mono ${estilos.megaTitulo}`}>Comunidade</p>
                  <Link href="/comunidade/">Visão geral</Link>
                  <Link href="/comunidade/discussoes/">Discussões</Link>
                  <Link href="/comunidade/perfil/">Meu perfil</Link>
                  <LinkModeracao />
                </div>
                <div className={estilos.megaColuna}>
                  <p className={`mono ${estilos.megaTitulo}`}>Acompanhar</p>
                  <Link href="/noticias/">Notícias</Link>
                  <Link href="/competicoes/">Competições nacionais</Link>
                  <Link href="/profissionais/">O que os profissionais usam</Link>
                  {/* Item FIXO, não condicional a estar logado. Descobrir se
                      há sessão custa duas idas à rede, e o cabeçalho pinta em
                      toda página do site — trocaria uma palavra por uma
                      requisição por navegação. A tela de entrar já sabe se
                      apresentar pra quem chega logado. */}
                  <Link href="/comunidade/entrar/">Entrar ou criar conta</Link>
                </div>
              </div>
            )}
          </div>
          {/* Profissionais saiu do nível principal e vive só dentro de
              Comunidade ▾ (decisão do fundador, 2026-08-03). O motivo é
              espaço: a barra precisa comportar a área de conta quando o
              cadastro entrar. Quatro itens de texto mais o CTA já é o limite
              antes de a barra começar a espremer em notebook. */}
          <Link href="/quiz/" className={`botao-primario ${estilos.ctaNav}`}>
            Fazer o teste
          </Link>
        </nav>

        {/* ── Mobile ── */}
        <button
          type="button"
          className={estilos.hamburguer}
          aria-expanded={drawerAberto}
          aria-controls="drawer-menu"
          aria-label={drawerAberto ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setDrawerAberto((v) => !v)}
        >
          <IconeMenu aberto={drawerAberto} />
        </button>
      </div>
      </header>

      {/* Drawer + backdrop FORA do <header>: o backdrop-filter do header vira
          bloco de contenção de descendentes position:fixed, o que espremia o
          drawer na barra do topo. Como irmãos do header, o bloco de contenção
          volta a ser a viewport (e o drawer sai do stacking context z-10). */}
      {drawerAberto && (
        <>
          <button
            type="button"
            className={estilos.backdrop}
            aria-label="Fechar menu"
            onClick={() => setDrawerAberto(false)}
          />
          <div
            id="drawer-menu"
            className={estilos.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            ref={drawerRef}
          >
            <p className={`mono ${estilos.drawerTitulo}`}>Materiais</p>
            <Link href="/catalogo/">Todos os materiais</Link>
            <Link href="/top-borrachas/">Borrachas do momento</Link>
            {TIPOS.map((t) => (
              <Link key={t.href} href={t.href}>
                {t.rotulo} <span className={`mono ${estilos.megaContagem}`}>{t.contagem}</span>
              </Link>
            ))}
            <Link href="/conjuntos/">Conjuntos montados</Link>
            <Link href="/comparar/">Comparar lado a lado</Link>
            <p className={`mono ${estilos.drawerTitulo}`}>Aprender</p>
            <Link href="/glossario/">Glossário</Link>
            <Link href="/escalas/">Tradutor de durezas</Link>
            <Link href="/aprender/">Todos os guias</Link>
            {/* Mesma arquitetura do desktop (D-03): o drawer listava só três
                itens e escondia discussões e perfil, que são o miolo da área. */}
            <p className={`mono ${estilos.drawerTitulo}`}>Comunidade</p>
            <Link href="/comunidade/">Visão geral</Link>
            <Link href="/comunidade/discussoes/">Discussões</Link>
            <Link href="/comunidade/perfil/">Meu perfil</Link>
            <LinkModeracao />
            <Link href="/comunidade/entrar/">Entrar ou criar conta</Link>
            <Link href="/noticias/">Notícias</Link>
            <Link href="/competicoes/">Competições nacionais</Link>
            <Link href="/profissionais/">O que os profissionais usam</Link>
            <Link href="/quiz/" className={`botao-primario ${estilos.drawerCta}`}>
              Fazer o teste →
            </Link>
          </div>
        </>
      )}
    </>
  );
}
