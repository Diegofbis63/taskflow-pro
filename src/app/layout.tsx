import { Metadata } from 'next';
import { generateMetadata, generateStructuredData, generateOrganizationStructuredData } from '@/lib/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Enterprise Project Management System',
  description: 'TaskFlow Pro is a comprehensive project management platform designed for teams. Streamline workflows, collaborate effectively, and deliver projects on time with our powerful suite of tools.',
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
    'gantt charts',
    'time tracking',
    'resource management',
    'project planning',
    'team productivity',
    'business management',
  ],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = generateStructuredData();
  const organizationData = generateOrganizationStructuredData();

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
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