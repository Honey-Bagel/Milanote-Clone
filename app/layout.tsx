import "@/app/ui/globals.css";
import { inter } from '@/app/ui/fonts';
import type { Metadata } from 'next';
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { ClerkProvider } from "@clerk/nextjs";
import InstantDBAuthSync from "@/components/auth/InstantDBAuthSync";
import { Toaster } from 'sonner';

export const metadata: Metadata = {
	title: 'Notera',
	description: 'A visual workspace for creative projects',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider>
			<InstantDBAuthSync />
			<html lang="en" suppressHydrationWarning={true}>
				<body className={`${inter.className} antialised`}>
						<ThemeProvider>
							{children}
						</ThemeProvider>
						<Toaster
							position="top-right"
							theme="dark"
							toastOptions={{
								style: {
									background: '#020617',
									border: '1px solid rgba(255, 255, 255, 0.1)',
									color: '#fff',
								},
							}}
						/>
				</body>
			</html>
		</ClerkProvider>
	);
}
