/**
 * Declaração de ambiente para imports de CSS.
 * Cobre tanto o CSS global (side-effect: `import './globals.css'`) quanto os
 * CSS Modules (`import styles from './page.module.css'`) num único padrão — sem
 * ambiguidade de wildcard. O bundler do Next é quem processa o CSS de fato;
 * isto só ensina o type-checker a resolver o módulo.
 */
declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
