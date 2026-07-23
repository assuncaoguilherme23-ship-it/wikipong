'use client';

/**
 * Cabeçalho com a arquitetura da D-03 — na medida do que EXISTE (D-16):
 *   · Materiais ▾ (mega-menu): Todos · por tipo (presets de filtro D-12) · Comparar
 *     (Comparar mora DENTRO de Materiais — D-03).
 *   · Glossário: link direto (vira grupo "Aprender ▾" quando houver ≥2 filhos).
 *   · Profissionais: 1º filho da futura Comunidade (D-03) — link direto por ora;
 *     vira "Comunidade ▾" quando avaliações/notícias existirem. Notícias/busca
 *     seguem ocultas até existirem (D-16 — sem link morto).
 *   · Mobile: hambúrguer → drawer verde-mesa com a MESMA arquitetura.
 * O quiz mantém a barra própria minimalista (fluxo de conversão).
 *
 * Escala de z-index (semântica): header 10 · mega 20 · backdrop 30 · drawer 40.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoCompleto } from './Logo';
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
  const [drawerAberto, setDrawerAberto] = useState(false);
  const megaRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Navegou → fecha tudo
  useEffect(() => {
    setMegaAberto(false);
    setDrawerAberto(false);
  }, [rota]);

  // Escape fecha; clique fora fecha o mega
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMegaAberto(false);
        setDrawerAberto(false);
      }
    };
    const aoClicar = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaAberto(false);
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
        <Link href="/" className={estilos.marca} aria-label="WikiPong — início">
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
              onClick={() => setMegaAberto((v) => !v)}
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
                  {TIPOS.map((t) => (
                    <Link key={t.href} href={t.href}>
                      {t.rotulo} <span className={`mono ${estilos.megaContagem}`}>{t.contagem}</span>
                    </Link>
                  ))}
                </div>
                <div className={estilos.megaColuna}>
                  <p className={`mono ${estilos.megaTitulo}`}>Ferramentas</p>
                  <Link href="/conjuntos/">Conjuntos montados</Link>
                  <Link href="/comparar/">Comparar lado a lado</Link>
                  <Link href="/quiz/">Teste de perfil</Link>
                </div>
              </div>
            )}
          </div>
          <Link
            href="/aprender/"
            className={estilos.navLink}
            aria-current={rota.startsWith('/aprender') ? 'page' : undefined}
          >
            Aprender
          </Link>
          <Link
            href="/profissionais/"
            className={estilos.navLink}
            aria-current={rota.startsWith('/profissionais') ? 'page' : undefined}
          >
            Profissionais
          </Link>
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
            {TIPOS.map((t) => (
              <Link key={t.href} href={t.href}>
                {t.rotulo} <span className={`mono ${estilos.megaContagem}`}>{t.contagem}</span>
              </Link>
            ))}
            <Link href="/conjuntos/">Conjuntos montados</Link>
            <Link href="/comparar/">Comparar lado a lado</Link>
            <p className={`mono ${estilos.drawerTitulo}`}>Aprender</p>
            <Link href="/aprender/">Guias</Link>
            <Link href="/glossario/">Glossário</Link>
            <p className={`mono ${estilos.drawerTitulo}`}>Comunidade</p>
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
