/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', 'pdf-parse', 'pdfjs-dist'],
  },
  outputFileTracingIncludes: {
    '/api/export/pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

module.exports = nextConfig;

