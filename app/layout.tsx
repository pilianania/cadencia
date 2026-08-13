import type { Metadata } from 'next';
import { Archivo, Bricolage_Grotesque, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

/* Tres roles tipográficos, tres familias:
 * · Bricolage Grotesque — display. Ancho ajustable, personalidad sin ser
 *   decorativa. Se usa con restricción: solo cabeceras y el número grande.
 * · Archivo — interfaz y texto. Grotesca de señalética, aguanta densidad.
 * · IBM Plex Mono — horas, deltas y contadores. Cifras tabulares obligatorias:
 *   en una columna de horarios, la alineación es legibilidad, no gusto. */

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cadencia · Gestión de turnos ambulatorios',
  description:
    'Tablero operativo en tiempo real para redes de clínicas ambulatorias: agenda del día, estado de turnos y alertas de demora accionables.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body
        className={`${bricolage.variable} ${archivo.variable} ${plexMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
