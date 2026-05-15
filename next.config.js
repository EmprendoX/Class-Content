/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', 'pdf-parse', 'pdfjs-dist'],
  },
};

module.exports = nextConfig;

