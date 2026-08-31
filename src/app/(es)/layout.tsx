/**
 * Root layout of the castellano side of the site, served under `/es`. The
 * language is a stable route of its own and not a state of the browser: the
 * letter has to be able to link one of the two, and a switch that depended on
 * JavaScript would break the bad-connection criterion (D-8).
 */
import type { ReactNode } from 'react';
import { SiteDocument } from '@/site/document';
import '../globals.css';

export default function CastellanoRootLayout({ children }: { children: ReactNode }) {
  return <SiteDocument locale="es">{children}</SiteDocument>;
}
