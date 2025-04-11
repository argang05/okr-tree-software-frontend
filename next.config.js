/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure react-d3-tree works properly
  reactStrictMode: true,
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  eslint: {
    // We'll handle linting separately
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 