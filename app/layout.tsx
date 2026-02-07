import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Providers from './components/Providers';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap'
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Web2ENS Bridge',
  description:
    'Prove web data and attach a verifiable, privacy-preserving proof to your ENS text record.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${plexMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
