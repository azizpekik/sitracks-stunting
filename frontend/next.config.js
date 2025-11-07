/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '*': ['./public/**/*'],
  },
  transpilePackages: ['lucide-react'],
  webpack: (config) => {
    // Add path mapping support for @/* aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }

    return config
  },
}

module.exports = nextConfig