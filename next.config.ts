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
			}
			// TODO: Add S3 bucket hostname when AWS S3 is integrated
			// {
			// 	protocol: 'https',
			// 	hostname: 'your-bucket.s3.amazonaws.com',
			// },
		],
	},
};

export default nextConfig;
