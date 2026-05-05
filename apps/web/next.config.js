/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@nazrah/ui', '@nazrah/i18n', '@nazrah/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    // App Router is stable in Next 15, no flag needed
  },
  async redirects() {
    return [
      {
        source: '/ar/:path*',
        has: [{ type: 'header', key: 'accept-language', value: '(?!ar).*' }],
        destination: '/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
