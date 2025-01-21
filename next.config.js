const path = require('path')
const { execSync } = require('child_process')

const commitHash = execSync('git rev-parse --short HEAD').toString().trim()

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // env variables
    COMMIT_HASH: commitHash,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
}

module.exports = nextConfig
