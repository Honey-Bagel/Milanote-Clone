'use client';

import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import { ArrowRight, Calendar, Check, CheckSquare, Code, Figma, Github, Globe, ImageIcon, Layers, Menu, MessageSquare, Sparkles, Type } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function LandingPage() {
	const [mousePos, setMousePos] = useState<{ x: number, y: number, parallaxX?: number, parallaxY?: number}>({ x: 0, y: 0 });
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const containerRef = useRef(null);
	const [email, setEmail] = useState("");
	const { isSignedIn } = useUser();

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (containerRef.current) {
				setMousePos({
					x: e.clientX,
					y: e.clientY,
					parallaxX: (e.clientX - window.innerWidth / 2) * 0.01,
					parallaxY: (e.clientY - window.innerHeight / 2) * 0.01
				});
			}
		};

		const handleScroll = () => {
			setScrolled(window.scrollY > 50);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('scroll', handleScroll);
		}
	});

	return (
		<div ref={containerRef} className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden relative selection:bg-accent/30 selection:text-cyan-50">
			{/* Background */}
			<div className="fixed inset-0 pointer-events-none z-0">
				<div className="absolute w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] mix-blend-screen transition-transform duration-75 ease-out" style={{ left: -400, top: -400, transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }} />
				<div className="absolute inset-0 opacity-[0.03]" style={{filter: 'contrast(120%)', backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
				<div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: `linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)`, backgroundSize: '60px 60px', transform: `perspective(1000px) rotateX(20deg) translate(${mousePos.parallaxX}px, ${mousePos.parallaxY}px)`, maskImage: 'radial-gradient(circle at center, black 0%, transparent 85%)' }} />
			</div>

			{/* Navigation */}
			<nav className={`fixed top-0 w-full z-50 h-20 transition-all duration-700 ease-in-out ${scrolled ? 'bg-background/90 backdrop-blur-md border-b border-white/10 shadow-2xl' : 'bg-transparent border-transparent'}`}>
				<div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
							<Layers size={16} className="text-white" />
						</div>
						<span className="font-bold text-lg tracking-tight text-white">Note App</span>
					</div>
					<div className="hidden md:flex items-center gap-8 text-sm font-medium text-secondary-foreground">
						<a href="#use-cases" className="hover:text-white transition-colors">Use Cases</a>
						<a href="#visual-engine" className="hover:text-white transition-colors">Visual Engine</a>
						<Link href="/pricing" className="hover:text-white tarnsition-colors">Pricing</Link>
						<div className={`h-4 w-px bg-secondary transition-opacity duration-700 ${scrolled ? 'opacity-100' : 'opacity-0'}`}></div>
						{/* Auth buttons */}
						{!isSignedIn ? (
							<>
								<Link
									href="/auth"
									className="text-white hover:text-accent transition-colors"
								>
									Log In
								</Link>
								<Link
									href="/auth?mode=signup"
									className="px-5 py-2 bg-white text-slate-950 hover:bg-slate-200 rounded-full text-xs font-bold transition-all shadow-[0_0_15px_rgba(255, 255, 255, 0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
								>
									Sign up
								</Link>
							</>
						) :
							(
								<Link
									href="/dashboard"
									className="px-5 py-2 bg-white text-slate-950 hover:bg-slate-200 rounded-full text-xs font-bold transition-all shadow-[0_0_15px_rgba(255, 255, 255, 0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
								>
									Dashboard
								</Link>
							)
						}
					</div>
					<div className="md:hidden text-secondary-foreground">
						<Menu size={24} onClick={() => setIsMenuOpen(!isMenuOpen)} />
					</div>
				</div>
			</nav>

			<main className="relative z-10 w-full min-h-screen pt-32 pb-20 px-4">

				{/* Hero section */}
				<div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center mb-32">
					<div className="text-left relative z-20">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-indigo-950/30 text-[10px] font-bold text-primary mb-8 tracking-widest uppercase">
							<Sparkles size={10} />
							<span>Spatial Workspace v1.0</span>
						</div>
						<h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
							The infinite <br /> paper for your <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">digital mind.</span>
						</h1>
						<p className="text-lg text-secondary-foreground max-w-xl mb-10 leading-relaxed font-light">
							Linear docs are for finishing ideas. Milanote Clone is for finding them. Drag, drop, and connect your thoughts on an infinite spatial plane.
						</p>
						{!isSignedIn ? (
							<form onSubmit={(e) => {e.preventDefault();}} className="flex flex-col sm:flex-row gap-3 max-w-md">
								<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="test@email.com" className="flex-1 bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder-slate-500" />
								<button className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">Join Beta <ArrowRight size={16}/></button>
							</form>
						): (
							<div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium"><Check size={16} />Access granted.</div>
						)}
					</div>

					{/* Interactive Canvas */}
					<div className="relative h-[500px] perspective-[1000px] group">
						<div className="absolute inset-0 rounded-3xl border border-white/10 bg-[#0f172a]/40 backdrop-blur-sm overflow-hidden shadow-2xl ring-1 ring-white/5 transition-all duration-500 hover:border-primary/30">
							<div className="absolute top-4 left-6 text-[10px] font-mono text-muted-foreground uppercase tracking-widest pointer-events-none z-20">Interactive Preview</div>
							<div id="canvas-container" className="absolute inset-0 cursor-crosshair">
							</div>
						</div>
					</div>
				</div>

					{/* --- NATIVE MEDIA ENGINE --- */}
					<section id="visual-engine" className="w-full max-w-7xl mx-auto mb-32">
						<div className="text-center mb-16">
							<h2 className="text-3xl font-bold text-white mb-4">Native Media Engine.</h2>
							<p className="text-secondary-foreground max-w-2xl mx-auto">
								Unlike standard whiteboards, CanvasOne understands code, video, and design assets natively.
							</p>
						</div>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[400px] md:h-[500px] overflow-hidden rounded-3xl border border-white/5 bg-[#0f172a]/20 p-4 relative group">
							<div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
							{/* Column 1 */}
							<div className="space-y-4 animate-scroll-slow">
								<div className="h-32 bg-indigo-900/20 rounded-xl border border-primary/20 flex items-center justify-center"><ImageIcon size={32} className="text-primary"/></div>
								<div className="h-48 bg-secondary rounded-xl border border-white/5"></div>
							</div>
							{/* Column 2 */}
							<div className="space-y-4 pt-12 animate-scroll-slow" style={{animationDelay: '-2s'}}>
								<div className="h-32 bg-cyan-900/20 rounded-xl border border-accent/20 flex items-center justify-center"><Type size={32} className="text-accent"/></div>
								<div className="h-40 bg-secondary rounded-xl border border-white/5"></div>
							</div>
							{/* Column 3 */}
							<div className="space-y-4 animate-scroll-slow" style={{animationDelay: '-5s'}}>
								<div className="h-48 bg-secondary rounded-xl border border-white/5 p-4 font-mono text-xs text-muted-foreground">const init = ...</div>
								<div className="h-32 bg-purple-900/20 rounded-xl border border-purple-500/20 flex items-center justify-center"><Code size={32} className="text-purple-400"/></div>
								<div className="h-40 bg-secondary rounded-xl border border-white/5"></div>
							</div>
							{/* Column 4 */}
							<div className="space-y-4 pt-8 animate-scroll-slow" style={{animationDelay: '-7s'}}>
								<div className="h-32 bg-emerald-900/20 rounded-xl border border-emerald-500/20 flex items-center justify-center"><CheckSquare size={32} className="text-emerald-400"/></div>
								<div className="h-48 bg-secondary rounded-xl border border-white/5"></div>
							</div>
							<div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] pointer-events-none"></div>
						</div>
					</section>

					{/* --- USE CASES  --- */}
					<section id="use-cases" className="w-full max-w-7xl mx-auto mb-32">
						<div className="text-left mb-12 pl-4 border-l-4 border-primary">
							<h2 className="text-3xl font-bold text-white mb-2">Start with a blueprint.</h2>
							<p className="text-secondary-foreground">See how teams use CanvasOne. Real card arrangements.</p>
						</div>
						
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							
							{/* 1. PRODUCT ROADMAP (Using Columns & Cards) */}
							<div className="bg-[#0f172a]/30 border border-slate-800 rounded-3xl overflow-hidden hover:border-primary/30 transition-all group">
								<div className="p-6 border-b border-white/5 flex justify-between items-center">
									<div className="flex items-center gap-2">
										<Calendar size={18} className="text-primary"/>
										<h3 className="font-bold text-white">Product Roadmap</h3>
									</div>
									<ArrowRight size={16} className="text-slate-600 group-hover:text-white transition-colors"/>
								</div>
								<div className="h-64 bg-[#020617]/50 relative overflow-hidden p-6 flex gap-4 overflow-x-auto">
									<div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
									{/* Using actual Column Components */}
									{/*<ColumnCard title="Q1: Foundation" count="3" color="bg-blue-500" items={["Auth Flow", "Database Schema", "API Setup"]} className="shrink-0" />
									<ColumnCard title="Q2: Growth" count="2" color="bg-emerald-500" items={["Invite System", "Billing Integration"]} className="shrink-0" />
									*/}
									<div className="w-12 h-full border-l border-dashed border-slate-800"></div>
								</div>
							</div>

							{/* 2. MOODBOARD (Using Images & Notes) */}
							<div className="bg-[#0f172a]/30 border border-slate-800 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all group">
								<div className="p-6 border-b border-white/5 flex justify-between items-center">
									<div className="flex items-center gap-2">
										<ImageIcon size={18} className="text-purple-400"/>
										<h3 className="font-bold text-white">Brand Moodboard</h3>
									</div>
									<ArrowRight size={16} className="text-slate-600 group-hover:text-white transition-colors"/>
								</div>
								<div className="h-64 bg-[#020617]/50 relative overflow-hidden p-6">
									{/* Scattered Cards */}
									{/*
									<ImageCard caption="Reference_01.jpg" className="absolute top-4 left-6 w-48 rotate-[-6deg] z-10" />
									<NoteCard title="Color Palette" content="#6366f1 Indigo \n#06b6d4 Cyan" className="absolute top-12 right-12 w-48 rotate-[4deg] z-20" />
									<ImageCard caption="Texture.png" className="absolute bottom-[-20px] left-32 w-48 rotate-[2deg] z-0 opacity-60" />
									*/}
								</div>
							</div>

						</div>
					</section>

					{/* --- INTEGRATIONS --- */}
					<section id="integrations" className="w-full max-w-4xl mx-auto mb-32 text-center">
						<h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-10">Works with your stack</h2>
						<div className="flex flex-wrap justify-center gap-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
							<div className="flex items-center gap-2 text-white"><Github size={24}/> <span className="font-bold">GitHub</span></div>
							<div className="flex items-center gap-2 text-white"><Figma size={24}/> <span className="font-bold">Figma</span></div>
							<div className="flex items-center gap-2 text-white"><Globe size={24}/> <span className="font-bold">Linear</span></div>
							<div className="flex items-center gap-2 text-white"><MessageSquare size={24}/> <span className="font-bold">Slack</span></div>
						</div>
					</section>
			</main>

			<footer className="w-full border-t border-white/5 bg-[#020617] py-12 px-6 relative z-10">
				<div className="max-w-7xl mx-auto">
					<div className="grid md:grid-cols-4 gap-8 mb-8">
						{/* Company */}
						<div>
							<div className="flex items-center space-x-3 mb-4">
								<div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
									background: `linear-gradient(to bottom right, var(--primary), var(--accent))`
								}}>
									<i className="fas fa-layer-group text-[var(--foreground)] text-sm"></i>
								</div>
								<span className="text-lg font-bold">Milanote</span>
							</div>
							<p className="text-[var(--muted)] text-sm">
								The visual workspace for creative projects.
							</p>
						</div>

						{/* Product */}
						<div>
							<h4 className="font-semibold mb-4">Product</h4>
							<ul className="space-y-2 text-sm text-[var(--muted)]">
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Features</a></li>
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Templates</a></li>
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Pricing</a></li>
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Security</a></li>
							</ul>
						</div>

						{/* Company */}
						<div>
							<h4 className="font-semibold mb-4">Company</h4>
							<ul className="space-y-2 text-sm text-[var(--muted)]">
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">About</a></li>
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Blog</a></li>
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Careers</a></li>
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Contact</a></li>
							</ul>
						</div>

						{/* Legal */}
						<div>
							<h4 className="font-semibold mb-4">Legal</h4>
							<ul className="space-y-2 text-sm text-[var(--muted)]">
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Privacy</a></li>
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Terms</a></li>
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Cookies</a></li>
								<li><a href="#" className="hover:text-[var(--foreground)] transition-colors">Licenses</a></li>
							</ul>
						</div>
					</div>

					{/* Bottom Bar */}
					<div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center">
						<p className="text-[var(--muted)] text-sm mb-4 md:mb-0">
							© 2024 Milanote. All rights reserved.
						</p>
						<div className="flex items-center space-x-6">
							<a href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
								<i className="fab fa-twitter text-xl"></i>
							</a>
							<a href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
								<i className="fab fa-facebook text-xl"></i>
							</a>
							<a href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
								<i className="fab fa-instagram text-xl"></i>
							</a>
							<a href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
								<i className="fab fa-linkedin text-xl"></i>
							</a>
						</div>
					</div>
				</div>
			</footer>

			<style>{`
				@keyframes scroll-slow { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
				.animate-scroll-slow { animation: scroll-slow 20s linear infinite; }
			`}</style>
		</div>
	);
}
