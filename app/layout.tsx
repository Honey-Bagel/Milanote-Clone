import "@/app/ui/globals.css";
import { inter } from '@/app/ui/fonts';
import type { Metadata } from 'next';
import { ThemeProvider } from "@/lib/contexts/theme-context";

export const metadata: Metadata = {
	title: 'Milanote Clone',
	description: 'A visual workspace for creative projects',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning={true}>
			<body className={`${inter.className} antialised`}>
				<ThemeProvider>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
