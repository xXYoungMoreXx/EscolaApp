import type { MetadataRoute } from 'next';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/changelog'];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://escola-app.vercel.app';
  return PUBLIC_ROUTES.map((path) => ({
    url: `${base}${path === '/' ? '' : path}`,
    lastModified: new Date(),
    changeFrequency: path === '/changelog' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.6,
  }));
}
