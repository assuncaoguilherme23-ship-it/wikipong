'use client';

/**
 * Cabeçalho compartilhado (home, catálogo, comparação). O quiz mantém a barra
 * própria minimalista (fluxo de conversão). Nav interina: só o que EXISTE entra
 * (D-16); a arquitetura completa com mega-menus (D-03) chega quando as áreas
 * existirem. Client component só pelo usePathname (estado ativo do link).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoCompleto } from './Logo';
import estilos from './Cabecalho.module.css';

const ITENS = [
  { href: '/catalogo/', rotulo: 'Materiais' },
  { href: '/comparar/', rotulo: 'Comparar' },
  { href: '/glossario/', rotulo: 'Glossário' },
] as const;

export function Cabecalho() {
  const rota = usePathname();

  return (
    <header className={estilos.cabecalho}>
      <div className={`container ${estilos.linha}`}>
        <Link href="/" className={estilos.marca} aria-label="WikiPong — início">
          <LogoCompleto altura={30} />
        </Link>
        <nav className={estilos.nav} aria-label="Principal">
          {ITENS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={estilos.navLink}
              aria-current={rota === item.href || rota === item.href.slice(0, -1) ? 'page' : undefined}
            >
              {item.rotulo}
            </Link>
          ))}
          <Link href="/quiz/" className={`botao-primario ${estilos.ctaNav}`}>
            Fazer o teste
          </Link>
        </nav>
      </div>
    </header>
  );
}
