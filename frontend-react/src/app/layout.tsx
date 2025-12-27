import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MSP Fleet Dashboard',
  description: 'Real-time PBX monitoring dashboard for MSPs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 min-h-screen text-white">
        {children}
      </body>
    </html>
  );
}