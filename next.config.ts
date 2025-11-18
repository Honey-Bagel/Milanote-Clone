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
				hostname: 'cjwizcvnujouehwhvowe.supabase.co',
			},
			{
				protocol: 'https',
				hostname: 'www.google.com'
			}
		],
	},
};

export default nextConfig;
