import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FieldCast — Farmer Weather Risk Dashboard',
  description: 'Real-time weather risk assessment for farmers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
