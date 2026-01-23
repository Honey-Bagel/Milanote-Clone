'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Layers, Menu, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export function LandingNavbar() {
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
	const [scrolled, setScrolled] = useState<boolean>(false);
	const { isSignedIn } = useUser();

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 50);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<nav
			className={`fixed top-0 w-full z-50 h-20 transition-colors duration-700 ease-in-out ${
				scrolled
					? 'bg-[#020617]/90 backdrop-blur-md border-b border-white/10 shadow-2xl'
					: 'bg-transparent border-transparent'
			}`}
		>
			<div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-3">
					<div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
						<Layers size={16} className="text-white" />
					</div>
					<span className="font-bold text-lg tracking-tight text-white">Notera</span>
				</Link>

				{/* Desktop Navigation */}
				<div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
					<a href="/#visual-engine" className="hover:text-white transition-colors">
						Visual Engine
					</a>
					<Link href="/pricing" className="hover:text-white transition-colors">
						Pricing
					</Link>
					<Link href="/faq" className="hover:text-white transition-colors">
						FAQ
					</Link>
					<div className={`h-4 w-px bg-slate-800 transition-opacity duration-700 ${
							scrolled ? 'opacity-100' : 'opacity-0'
						}`}
					/>
					{/* Auth buttons */}
					{!isSignedIn ? (
						<>
							<Link href="/auth" className="text-white hover:text-cyan-400 transition-colors">
								Log in
							</Link>
							<Link
								href="/auth?mode=signup"
								className="px-5 py-2 bg-white text-slate-950 hover:bg-slate-200 rounded-full text-xs font-bold transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
							>
								Sign up
							</Link>
						</>
					) : (
						<Link
							href="/dashboard"
							className="px-5 py-2 bg-white text-slate-950 hover:bg-slate-200 rounded-full text-xs font-bold transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
						>
							Dashboard
						</Link>
					)}
				</div>

				{/* Mobile Menu Button */}
				<button
					className="md:hidden text-slate-400 hover:text-white transition-colors p-2 -mr-2"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					aria-label="Toggle menu"
				>
					{isMenuOpen ? <X size={24} /> : <Menu size={24} />}
				</button>
			</div>

			{/* Mobile Menu */}
			{isMenuOpen && (
				<div className="md:hidden absolute top-20 left-0 right-0 bg-[#020617]/98 backdrop-blur-md border-b border-white/10 shadow-2xl">
					<div className="px-6 py-6 space-y-4">
						<a
							href="/#visual-engine"
							className="block py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors border-b border-white/5"
							onClick={() => setIsMenuOpen(false)}
						>
							Visual Engine
						</a>
						<Link
							href="/pricing"
							className="block py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors border-b border-white/5"
							onClick={() => setIsMenuOpen(false)}
						>
							Pricing
						</Link>
						<Link
							href="/faq"
							className="block py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors border-b border-white/5"
							onClick={() => setIsMenuOpen(false)}
						>
							FAQ
						</Link>

						<div className="pt-4 space-y-3">
							{!isSignedIn ? (
								<>
									<Link
										href="/auth"
										className="block w-full text-center py-3 text-white hover:text-cyan-400 transition-colors border border-white/10 rounded-lg"
										onClick={() => setIsMenuOpen(false)}
									>
										Log in
									</Link>
									<Link
										href="/auth?mode=signup"
										className="block w-full text-center px-5 py-3 bg-white text-slate-950 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    					onClick={() => setIsMenuOpen(false)}
									>
										Sign up
									</Link>
								</>
							) : (
								<Link
									href="/dashboard"
									className="block w-full text-center px-5 py-3 bg-white text-slate-950 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
									onClick={() => setIsMenuOpen(false)}
								>
									Dashboard
								</Link>
							)}
						</div>
					</div>
				</div>
			)}
		</nav>
	);
}