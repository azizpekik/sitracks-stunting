/** @type {import('next').NextConfig} */
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
      '@': './src',
    }

    return config
  },
}

module.exports = nextConfig