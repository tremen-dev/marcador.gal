/**
 * Root layout of the galego side of the site. Galego carries NO url prefix
 * because it is the default language (D-2), and the two languages are separate
 * root layouts because `<html lang>` has to differ between them.
 */
import type { ReactNode } from 'react';
import { SiteDocument } from '@/site/document';
import '../globals.css';

export default function GalegoRootLayout({ children }: { children: ReactNode }) {
  return <SiteDocument locale="gl">{children}</SiteDocument>;
}
