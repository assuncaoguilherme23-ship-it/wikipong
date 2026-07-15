/**
 * Rodapé "mesa": a cor da identidade fecha toda página. O truque dos tokens:
 * o escopo do rodapé REMAPEIA --cor-tinta/--cor-papel/--cor-acento locais, então
 * o LogoCompleto (que pinta com esses tokens) adapta sozinho ao fundo escuro.
 * Nav: só rotas que existem (D-16).
 */
import Link from 'next/link';
import { LogoCompleto } from './Logo';
import estilos from './Rodape.module.css';

const COLUNAS = [
  {
    titulo: 'Materiais',
    itens: [
      { href: '/catalogo/', rotulo: 'Catálogo' },
      { href: '/comparar/', rotulo: 'Comparar' },
    ],
  },
  {
    titulo: 'Aprender',
    itens: [
      { href: '/aprender/', rotulo: 'Guias' },
      { href: '/glossario/', rotulo: 'Glossário' },
      { href: '/quiz/', rotulo: 'Fazer o teste' },
    ],
  },
] as const;

export function Rodape() {
  return (
    <footer className={estilos.rodape}>
      <div className={`container ${estilos.grade}`}>
        <div className={estilos.marca}>
          <LogoCompleto altura={28} />
          <p className={estilos.tagline}>
            Feito pra explicar, não pra empurrar. Enciclopédia de equipamentos de tênis de
            mesa em português.
          </p>
        </div>
        {COLUNAS.map((coluna) => (
          <nav key={coluna.titulo} aria-label={coluna.titulo} className={estilos.coluna}>
            <p className={`mono ${estilos.colunaTitulo}`}>{coluna.titulo}</p>
            <ul>
              {coluna.itens.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.rotulo}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={`container ${estilos.base}`}>
        <hr className={estilos.linhaCentral} aria-hidden="true" />
        <p>WikiPong — métricas com fórmula aberta, opinião sempre rotulada.</p>
      </div>
    </footer>
  );
}
