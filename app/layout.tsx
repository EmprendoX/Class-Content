import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Aula · Genera clases completas con IA',
  description:
    'Herramienta para maestros, educadores y familias: del tema a la clase lista para dar, con guión por fases, ejemplos resueltos, hoja de trabajo y ticket de salida.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
