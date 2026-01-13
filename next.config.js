/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const config = {
  allowedDevOrigins: [
    "1342576900647817309.discordsays.com",
    "mac.han-tailor.ts.net",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "content.motorsportstats.com",
        pathname: "/driverProfilePicture/**",
      },
    ],
  },

  async headers() {
    // Only apply no-cache headers in development
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "no-cache, no-store, must-revalidate",
            },
            {
              key: "Pragma",
              value: "no-cache",
            },
            {
              key: "Expires",
              value: "0",
            },
          ],
        },
      ];
    }
    return [];
  },
};

// Setup Sentry with proper ES Module syntax
export default withSentryConfig(config, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "gridscout",
  project: "gridscout-live",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Tree-shaking options for reducing bundle size
  disableLogger: true,

  // Automatically monitor Vercel Cron jobs
  automaticVercelMonitors: true,
});
