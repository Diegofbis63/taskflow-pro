import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  openGraph?: {
    title?: string;
    description?: string;
    images?: string[];
    type?: string;
    url?: string;
    siteName?: string;
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    title?: string;
    description?: string;
    images?: string[];
  };
  canonical?: string;
  noindex?: boolean;
  alternateLanguages?: { [key: string]: string };
  jsonLd?: any;
}

class SEOService {
  private defaultConfig: SEOConfig = {
    title: 'TaskFlow Pro - Enterprise Project Management',
    description: 'Comprehensive enterprise-grade project management system with team collaboration, advanced analytics, and real-time updates.',
    keywords: [
      'project management',
      'team collaboration',
      'enterprise software',
      'task tracking',
      'analytics',
      'productivity',
      'workflow',
      'agile',
      'scrum',
      'kanban'
    ],
    openGraph: {
      type: 'website',
      siteName: 'TaskFlow Pro',
      images: ['/images/og-default.jpg']
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/images/twitter-default.jpg']
    }
  };

  /**
   * Generate metadata for a page
   */
  generateMetadata(config: Partial<SEOConfig>): Metadata {
    const finalConfig = { ...this.defaultConfig, ...config };

    const metadata: Metadata = {
      title: finalConfig.title,
      description: finalConfig.description,
      keywords: finalConfig.keywords?.join(', '),
      robots: finalConfig.noindex ? 'noindex,nofollow' : 'index,follow',
      canonical: finalConfig.canonical,
      alternates: {
        canonical: finalConfig.canonical,
        languages: finalConfig.alternateLanguages
      },
      openGraph: {
        title: finalConfig.openGraph?.title || finalConfig.title,
        description: finalConfig.openGraph?.description || finalConfig.description,
        type: finalConfig.openGraph?.type || 'website',
        siteName: finalConfig.openGraph?.siteName,
        url: finalConfig.openGraph?.url,
        images: finalConfig.openGraph?.images?.map(image => ({
          url: image,
          width: 1200,
          height: 630,
          alt: finalConfig.title
        }))
      },
      twitter: {
        card: finalConfig.twitter?.card || 'summary_large_image',
        title: finalConfig.twitter?.title || finalConfig.title,
        description: finalConfig.twitter?.description || finalConfig.description,
        images: finalConfig.twitter?.images
      }
    };

    // Add JSON-LD structured data
    if (finalConfig.jsonLd) {
      metadata.other = {
        ...metadata.other,
        'application/ld+json': JSON.stringify(finalConfig.jsonLd)
      };
    }

    return metadata;
  }

  /**
   * Generate JSON-LD structured data
   */
  generateJsonLd(type: string, data: any): any {
    const baseJsonLd = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };

    switch (type) {
      case 'Organization':
        return this.generateOrganizationJsonLd(data);
      case 'WebApplication':
        return this.generateWebApplicationJsonLd(data);
      case 'Product':
        return this.generateProductJsonLd(data);
      case 'Article':
        return this.generateArticleJsonLd(data);
      case 'BreadcrumbList':
        return this.generateBreadcrumbJsonLd(data);
      default:
        return baseJsonLd;
    }
  }

  /**
   * Generate Organization JSON-LD
   */
  private generateOrganizationJsonLd(data: any): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'TaskFlow Pro',
      url: 'https://taskflow-pro.com',
      logo: 'https://taskflow-pro.com/images/logo.png',
      description: 'Enterprise project management system',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-123-4567',
        contactType: 'customer service',
        availableLanguage: ['English', 'Spanish', 'French']
      },
      sameAs: [
        'https://twitter.com/taskflowpro',
        'https://linkedin.com/company/taskflow-pro',
        'https://github.com/taskflow-pro'
      ],
      ...data
    };
  }

  /**
   * Generate WebApplication JSON-LD
   */
  private generateWebApplicationJsonLd(data: any): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'TaskFlow Pro',
      url: 'https://taskflow-pro.com',
      description: 'Enterprise project management system with team collaboration and analytics',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250'
      },
      ...data
    };
  }

  /**
   * Generate Product JSON-LD
   */
  private generateProductJsonLd(data: any): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'TaskFlow Pro',
      description: 'Enterprise project management system',
      brand: {
        '@type': 'Brand',
        name: 'TaskFlow Pro'
      },
      offers: {
        '@type': 'Offer',
        price: '29.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250'
      },
      review: [
        {
          '@type': 'Review',
          author: {
            '@type': 'Person',
            name: 'John Doe'
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '5'
          },
          reviewBody: 'Excellent project management tool!'
        }
      ],
      ...data
    };
  }

  /**
   * Generate Article JSON-LD
   */
  private generateArticleJsonLd(data: any): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      description: data.description,
      image: data.image,
      author: {
        '@type': 'Person',
        name: data.author || 'TaskFlow Pro Team'
      },
      publisher: {
        '@type': 'Organization',
        name: 'TaskFlow Pro',
        logo: {
          '@type': 'ImageObject',
          url: 'https://taskflow-pro.com/images/logo.png'
        }
      },
      datePublished: data.datePublished,
      dateModified: data.dateModified,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': data.url
      },
      ...data
    };
  }

  /**
   * Generate BreadcrumbList JSON-LD
   */
  private generateBreadcrumbJsonLd(data: { breadcrumbs: Array<{ name: string; url: string }> }): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: data.breadcrumbs.map((breadcrumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: breadcrumb.name,
        item: breadcrumb.url
      }))
    };
  }

  /**
   * Generate sitemap XML
   */
  async generateSitemap(): Promise<string> {
    const baseUrl = 'https://taskflow-pro.com';
    
    const staticPages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/dashboard', priority: 0.9, changefreq: 'daily' },
      { url: '/projects', priority: 0.8, changefreq: 'weekly' },
      { url: '/tasks', priority: 0.8, changefreq: 'weekly' },
      { url: '/teams', priority: 0.7, changefreq: 'weekly' },
      { url: '/analytics', priority: 0.6, changefreq: 'monthly' },
      { url: '/about', priority: 0.5, changefreq: 'monthly' },
      { url: '/contact', priority: 0.4, changefreq: 'yearly' }
    ];

    // Get dynamic pages from database
    const [projects, teams] = await Promise.all([
      db.project.findMany({
        select: { id: true, updatedAt: true },
        take: 1000
      }),
      db.team.findMany({
        select: { id: true, updatedAt: true },
        take: 1000
      })
    ]);

    const dynamicPages = [
      ...projects.map(project => ({
        url: `/projects/${project.id}`,
        priority: 0.7,
        changefreq: 'weekly' as const,
        lastmod: project.updatedAt
      })),
      ...teams.map(team => ({
        url: `/teams/${team.id}`,
        priority: 0.6,
        changefreq: 'weekly' as const,
        lastmod: team.updatedAt
      }))
    ];

    const allPages = [...staticPages, ...dynamicPages];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod.toISOString()}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return sitemap;
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: https://taskflow-pro.com/sitemap.xml

# Disallow admin areas
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /static/

# Allow specific API endpoints for SEO
Allow: /api/sitemap
Allow: /api/robots

# Crawl delay for respectful crawling
Crawl-delay: 1`;
  }

  /**
   * Generate meta tags for social sharing
   */
  generateSocialMeta(config: Partial<SEOConfig>): {
    facebookMeta: string;
    twitterMeta: string;
  } {
    const finalConfig = { ...this.defaultConfig, ...config };

    const facebookMeta = `
<meta property="og:title" content="${finalConfig.openGraph?.title || finalConfig.title}">
<meta property="og:description" content="${finalConfig.openGraph?.description || finalConfig.description}">
<meta property="og:type" content="${finalConfig.openGraph?.type || 'website'}">
<meta property="og:url" content="${finalConfig.openGraph?.url || ''}">
<meta property="og:site_name" content="${finalConfig.openGraph?.siteName || 'TaskFlow Pro'}">
${finalConfig.openGraph?.images?.map(image => `<meta property="og:image" content="${image}">`).join('\n') || ''}
`.trim();

    const twitterMeta = `
<meta name="twitter:card" content="${finalConfig.twitter?.card || 'summary_large_image'}">
<meta name="twitter:title" content="${finalConfig.twitter?.title || finalConfig.title}">
<meta name="twitter:description" content="${finalConfig.twitter?.description || finalConfig.description}">
${finalConfig.twitter?.images?.map(image => `<meta name="twitter:image" content="${image}">`).join('\n') || ''}
`.trim();

    return { facebookMeta, twitterMeta };
  }

  /**
   * Generate structured data for FAQ pages
   */
  generateFAQJsonLd(faqs: Array<{ question: string; answer: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  /**
   * Generate structured data for How-to guides
   */
  generateHowToJsonLd(data: {
    name: string;
    description: string;
    steps: Array<{ name: string; text: string; image?: string }>;
  }): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: data.name,
      description: data.description,
      step: data.steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
        image: step.image
      }))
    };
  }

  /**
   * Generate structured data for events
   */
  generateEventJsonLd(data: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    organizer?: string;
  }): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      location: {
        '@type': 'Place',
        name: data.location
      },
      organizer: data.organizer ? {
        '@type': 'Organization',
        name: data.organizer
      } : undefined
    };
  }
}

export const seoService = new SEOService();

// Export types and utilities
export type { SEOConfig };
export { generateJsonLd } from './seo';