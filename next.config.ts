import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
