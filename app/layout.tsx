/**
 * WikiPong · layout raiz (App Router)
 * ------------------------------------------------------------------------------
 * Fontes da D-04 via next/font (self-hosted no build — sem request externo em
 * runtime, bom p/ perf e privacidade do export estático):
 *   Archivo (display) · Inter (corpo) · JetBrains Mono (dados/eyebrows/metadados).
 *
 * `metadata` demonstra o ganho de escolher Next (D-17): SEO/OG por rota, gerado
 * no build. `lang="pt-BR"` porque PT-BR é a língua do produto (CLAUDE.md).
 */
import type { Metadata, Viewport } from 'next';
import { Archivo, Inter, JetBrains_Mono } from 'next/font/google';
import { URL_SITE } from '@/componentes/site';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--fonte-archivo',
  weight: ['600', '700', '800'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--fonte-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--fonte-jetbrains',
  weight: ['400', '500'],
  display: 'swap',
});

/* Base absoluta para OG/canônicas — mesma constante que o sitemap e o robots
   usam (componentes/site.ts). Uma definição só: trocar de domínio não pode
   deixar metade do site apontando pro endereço velho. */
const urlSite = URL_SITE;

export const metadata: Metadata = {
  metadataBase: new URL(urlSite),
  title: {
    default: 'WikiPong · Enciclopédia de tênis de mesa',
    template: '%s · WikiPong',
  },
  description:
    'Feito pra explicar, não pra empurrar. Fichas, métricas e comparações de ' +
    'equipamentos de tênis de mesa. Recomendação explicada, nunca imposta.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'WikiPong',
  },
  /* Verificação de propriedade no Google Search Console. Fica aqui, e não num
     arquivo solto na raiz, porque `trailingSlash: true` transforma toda rota em
     pasta — um .html avulso na raiz é redirecionado e não é entregue. A meta tag
     não depende de roteamento, e ainda fica versionada com o resto dos metadados.
     NÃO REMOVER: o Google revalida periodicamente e tirar isto derruba a
     propriedade, junto com o acesso à Mudança de Endereço do .com.br. */
  verification: {
    google: 'FPdDpAKURzn7U2nZ2vTuj_xcbw9Y1n1-kd_L_ThMV7E',
  },
};

/* Barra do navegador acompanha o tema (tokens --cor-papel de cada modo) */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#101410' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
