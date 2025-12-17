import { Metadata } from 'next';

// Static metadata for better performance
export const metadata: Metadata = {
  title: 'TaskFlow Pro - Enterprise Project Management',
  description: 'Comprehensive project management platform designed for teams. Streamline workflows, collaborate effectively, and deliver projects on time.',
  keywords: [
    'project management',
    'team collaboration', 
    'task management',
    'workflow automation',
    'enterprise software',
    'productivity tools',
    'agile project management',
    'scrum tools',
    'kanban boards',
  ],
  authors: [{ name: 'TaskFlow Pro Team' }],
  creator: 'TaskFlow Pro',
  publisher: 'TaskFlow Pro',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://taskflow-pro.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://taskflow-pro.vercel.app',
    title: 'TaskFlow Pro - Enterprise Project Management',
    description: 'Comprehensive project management platform designed for teams.',
    siteName: 'TaskFlow Pro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskFlow Pro - Enterprise Project Management',
    description: 'Comprehensive project management platform designed for teams.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="apple-mobile-web-app-title" content="TaskFlow Pro" />
        <meta name="application-name" content="TaskFlow Pro" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}