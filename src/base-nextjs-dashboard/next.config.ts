import type { NextConfig } from "next";

// SVGO's preset-default strips `viewBox`, which leaves every icon with no
// coordinate system: a CSS box smaller than the icon's intrinsic size then
// *crops* it to the top-left corner instead of scaling it down. That is why
// `size-4` on a 24x24 icon showed two thirds of a calendar. Keep the viewBox so
// the `size-*` classes scale, and give both bundlers the same options — dev
// runs Turbopack, `next build` runs webpack.
const svgrOptions = {
  svgoConfig: {
    plugins: [{ name: "preset-default", params: { overrides: { removeViewBox: false } } }],
  },
};

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone", // Required for Docker deployment
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [{ loader: "@svgr/webpack", options: svgrOptions }],
    });
    return config;
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: [{ loader: '@svgr/webpack', options: svgrOptions }],
        as: '*.js',
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
