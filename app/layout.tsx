import "@/app/ui/globals.css";
import { inter } from '@/app/ui/fonts';
import type { Metadata } from 'next';
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { ClerkProvider } from "@clerk/nextjs";
import InstantDBAuthSync from "@/components/auth/InstantDBAuthSync";

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
				</body>
			</html>
		</ClerkProvider>
	);
}
