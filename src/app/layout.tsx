import type { Metadata } from 'next'; import { Navbar } from '@/components/Navbar'; import { Footer } from '@/components/Footer'; import './globals.css';
export const metadata: Metadata = { title: { default: 'OpenSourcery — Discover open-source projects', template: '%s | OpenSourcery' }, description: 'A community-curated catalog for discovering the right open-source tools.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element { return <html lang="en"><body><Navbar />{children}<Footer /></body></html>; }
