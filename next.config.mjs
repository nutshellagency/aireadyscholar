/** @type {import('next').NextConfig} */
const nextConfig = {
  // The four methods are served only through the ARS connector (kit 1.3.0): old skill downloads go to the kit page.
  async redirects() {
    return [
      { source: "/downloads/scholar-skills.zip", destination: "/kit", permanent: false },
      { source: "/downloads/skills/:file*", destination: "/kit", permanent: false },
    ];
  },
};
export default nextConfig;
