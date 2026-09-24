import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://escola-app.vercel.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/forgot-password', '/changelog'],
        disallow: ['/api/', '/dashboard', '/students', '/teachers', '/subjects', '/classes', '/grades', '/attendance', '/settings', '/change-password'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
