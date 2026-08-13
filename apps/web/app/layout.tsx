import type { Metadata } from 'next';
import { Geist_Mono, Inter, Montserrat } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gestión de Turnos',
  description: 'Sistema de Gestión de Turnos Clínicos — MVP',
};

/**
 * Layout raíz de la aplicación web.
 *
 * @param props - Children de Next.js App Router.
 * @returns HTML con fuentes Inter / Montserrat / Geist Mono.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${montserrat.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
