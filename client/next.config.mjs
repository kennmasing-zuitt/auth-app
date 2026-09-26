/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a small self-contained server for the Docker image
  output: "standalone",
  // Forwards /api/* to the Node server. In production Nginx routes /api to the
  // server directly, so this mainly serves local dev and direct :3000 access.
  // Note: evaluated at BUILD time, so API_URL is passed as a Docker build arg.
  async rewrites() {
    const apiUrl = process.env.API_URL || "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
