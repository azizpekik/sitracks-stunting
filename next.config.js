/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '*': ['./public/**/*'],
  },
  transpilePackages: ['lucide-react'],
}

module.exports = nextConfig