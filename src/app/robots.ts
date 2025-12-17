import { MetadataRoute } from 'next';
import { robots } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return robots();
}