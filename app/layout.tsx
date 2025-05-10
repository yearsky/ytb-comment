import './globals.css';

import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'YTB Comment Manager',
  description:
    'Youtube comment manager for delete bets promotion'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">{children}</body>
      <Analytics />
    </html>
  );
}
