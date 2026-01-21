import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
			{
				protocol: 'https',
				hostname: 'www.google.com'
			},
			{
				protocol: 'https',
				hostname: 'pub-765d54631444422ba1ea7243d1b0bb91.r2.dev'
			}
		],
	},
};

export default nextConfig;
