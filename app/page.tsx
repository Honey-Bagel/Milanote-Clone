'use client';

import Link from "next/link";
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export default function LandingPage() {
	const supabase = createClient();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		const fetchUser = async () => {
			const { data, error } = await supabase.auth.getUser();
			if (error) return;
			setUser(data.user);
		}
		fetchUser();
	});

	return (
		<div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
			{/* Navigation */}
			<nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
				<div className="max-w-7xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						{/* Logo */}
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, var(--primary), var(--accent))` }}>
								<i className="fas fa-layer-group text-[var(--foreground)] text-lg"></i>
							</div>
							<span className="text-xl font-bold">Note App</span>
						</div>

						{/* Navigation Links */}
						<div className="hidden md:flex items-center space-x-8">
							<a href="#features" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm font-medium">
								Features
							</a>
							<a href="#how-it-works" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm font-medium">
								How it Works
							</a>
							<a href="#testimonials" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm font-medium">
								Testimonials
							</a>
							<a href="#pricing" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm font-medium">
								Pricing
							</a>
						</div>

						{/* Auth Buttons */}
						{!user ? (
								<div className="flex items-center space-x-4">
									<Link
										href="/auth"
										className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm font-medium"
									>
										Log In
									</Link>
									<Link
										href="/auth?mode=signup"
										className="px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-lg hover:shadow-xl hover:opacity-90"
										style={{
											background: `linear-gradient(to right, var(--primary), var(--accent))`,
											color: 'var(--foreground)'
										}}
									>
										Sign Up Free
									</Link>
								</div>
							) : (
								<div className="flex items-center">
									<Link
										href="/dashboard"
										className="px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-lg hover:shadow-xl hover:opacity-90"
										style={{
											background: `linear-gradient(to right, var(--primary), var(--accent))`,
											color: 'var(--foreground)'
										}}
									>
										Dashboard
									</Link>
								</div>
							)}
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative pt-32 pb-20 px-6 overflow-hidden">
				{/* Background decorations */}
				<div className="absolute top-0 right-0 w-96 h-96 opacity-10 rounded-full blur-3xl" style={{ backgroundColor: 'var(--primary)' }}></div>
				<div className="absolute bottom-0 left-0 w-96 h-96 opacity-10 rounded-full blur-3xl" style={{ backgroundColor: 'var(--accent)' }}></div>

				{/* Grid pattern */}
				<div className="absolute inset-0 opacity-5" style={{
					backgroundImage: `
						linear-gradient(var(--primary) 1px, transparent 1px),
						linear-gradient(90deg, var(--primary) 1px, transparent 1px)
					`,
					backgroundSize: '50px 50px'
				}}></div>

				<div className="max-w-7xl mx-auto relative z-10">
					<div className="text-center max-w-4xl mx-auto">
						<h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
							Organize Your{' '}
							<span className="text-transparent bg-clip-text" style={{
								backgroundImage: `linear-gradient(to right, var(--primary), var(--accent))`
							}}>
								Creative Projects
							</span>{' '}
							Visually
						</h1>
						<p className="text-xl text-[var(--muted)] mb-10 leading-relaxed">
							The tool for organizing creative projects into beautiful visual boards.
							Collect inspiration, organize ideas, and build stunning mood boards.
						</p>
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
							<a
								href="/auth"
								className="px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
								style={{
									background: `linear-gradient(to right, var(--primary), var(--accent))`,
									color: 'var(--foreground)'
								}}
							>
								Start for Free
							</a>
							<button className="px-8 py-4 bg-[var(--card)] border border-[var(--border)] rounded-lg font-semibold text-lg hover:bg-[var(--card-hover)] transition-all">
								Watch Demo
								<i className="fas fa-play ml-2 text-sm"></i>
							</button>
						</div>
						<p className="text-sm text-[var(--muted)] mt-6">
							No credit card required • Free forever plan available
						</p>
					</div>

					{/* Hero Image/Dashboard Preview */}
					<div className="mt-20 relative">
						<div className="absolute inset-0 z-10" style={{
							background: `linear-gradient(to top, var(--background), transparent)`
						}}></div>
						<div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl transform perspective-1000 rotate-x-2">
							<div className="aspect-video bg-[var(--secondary)] p-8 flex items-center justify-center">
								<div className="text-center">
									<i className="fas fa-image text-[var(--muted)] text-6xl mb-4"></i>
									<p className="text-[var(--muted)]">Dashboard Preview</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-20 px-6 bg-[var(--background)]">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							Everything You Need
						</h2>
						<p className="text-xl text-[var(--muted)]">
							Powerful features to bring your creative vision to life
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{/* Feature 1 */}
						<div className="bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-8 hover:bg-[var(--card)] transition-all hover:border-[var(--primary)] group">
							<div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--primary)', opacity: 0.2 }}>
								<i className="fas fa-palette text-[var(--primary)] text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Visual Workspace</h3>
							<p className="text-[var(--muted)] leading-relaxed">
								Create beautiful boards with notes, images, tasks, links, and files. Drag, drop, and arrange everything visually.
							</p>
						</div>

						{/* Feature 2 */}
						<div className="bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-8 hover:bg-[var(--card)] transition-all hover:border-[var(--primary)] group">
							<div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
								<i className="fas fa-users text-[var(--accent)] text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Real-time Collaboration</h3>
							<p className="text-[var(--muted)] leading-relaxed">
								Work together with your team in real-time. Share boards, leave comments, and see changes instantly.
							</p>
						</div>

						{/* Feature 3 */}
						<div className="bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-8 hover:bg-[var(--card)] transition-all hover:border-[var(--primary)] group">
							<div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--primary)', opacity: 0.2 }}>
								<i className="fas fa-mobile-alt text-[var(--primary)] text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Access Anywhere</h3>
							<p className="text-[var(--muted)] leading-relaxed">
								Cloud-synced across all devices. Work on desktop, tablet, or mobile. Your boards are always up to date.
							</p>
						</div>

						{/* Feature 4 */}
						<div className="bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-8 hover:bg-[var(--card)] transition-all hover:border-[var(--primary)] group">
							<div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
								<i className="fas fa-search text-[var(--accent)] text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Powerful Search</h3>
							<p className="text-[var(--muted)] leading-relaxed">
								Find anything instantly. Search across all your boards, notes, and files with lightning-fast results.
							</p>
						</div>

						{/* Feature 5 */}
						<div className="bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-8 hover:bg-[var(--card)] transition-all hover:border-[var(--primary)] group">
							<div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--primary)', opacity: 0.2 }}>
								<i className="fas fa-layer-group text-[var(--primary)] text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Flexible Organization</h3>
							<p className="text-[var(--muted)] leading-relaxed">
								Organize with columns, sections, and nested boards. Structure your work exactly how you want it.
							</p>
						</div>

						{/* Feature 6 */}
						<div className="bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-8 hover:bg-[var(--card)] transition-all hover:border-[var(--primary)] group">
							<div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
								<i className="fas fa-lock text-[var(--accent)] text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Secure & Private</h3>
							<p className="text-[var(--muted)] leading-relaxed">
								Your data is encrypted and secure. Control who sees your boards with granular privacy settings.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section id="how-it-works" className="py-20 px-6 bg-[var(--secondary)]">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							How It Works
						</h2>
						<p className="text-xl text-[var(--muted)]">
							Get started in minutes
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-12">
						{/* Step 1 */}
						<div className="text-center">
							<div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold" style={{
								background: `linear-gradient(to bottom right, var(--primary), var(--accent))`
							}}>
								1
							</div>
							<h3 className="text-2xl font-bold mb-4">Create a Board</h3>
							<p className="text-[var(--muted)] leading-relaxed">
								Start with a blank canvas or choose from beautiful templates designed for various projects.
							</p>
						</div>

						{/* Step 2 */}
						<div className="text-center">
							<div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold" style={{
								background: `linear-gradient(to bottom right, var(--accent), var(--primary))`
							}}>
								2
							</div>
							<h3 className="text-2xl font-bold mb-4">Add Your Content</h3>
							<p className="text-[var(--muted)] leading-relaxed">
								Drag and drop notes, images, links, tasks, and files. Arrange them visually however you like.
							</p>
						</div>

						{/* Step 3 */}
						<div className="text-center">
							<div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold" style={{
								background: `linear-gradient(to bottom right, var(--primary), var(--accent))`
							}}>
								3
							</div>
							<h3 className="text-2xl font-bold mb-4">Share & Collaborate</h3>
							<p className="text-[var(--muted)] leading-relaxed">
								Invite your team, share with clients, or keep it private. Collaborate in real-time effortlessly.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section id="testimonials" className="py-20 px-6 bg-[var(--card)]">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							Loved by Creative Teams
						</h2>
						<p className="text-xl text-[var(--muted)]">
							See what our users have to say
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{/* Testimonial 1 */}
						<div className="bg-[var(--secondary)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-8">
							<div className="flex items-center mb-6">
								<div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold mr-4" style={{
									background: `linear-gradient(to bottom right, var(--primary), var(--accent))`
								}}>
									SM
								</div>
								<div>
									<p className="font-semibold">Sarah Mitchell</p>
									<p className="text-sm text-[var(--muted)]">Product Designer</p>
								</div>
							</div>
							<p className="text-[var(--foreground)] opacity-90 italic leading-relaxed">
								&quot;Milanote has completely transformed how I organize my design projects. It&apos;s intuitive and beautiful.&quot;
							</p>
						</div>

						{/* Testimonial 2 */}
						<div className="bg-[var(--secondary)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-8">
							<div className="flex items-center mb-6">
								<div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold mr-4" style={{
									background: `linear-gradient(to bottom right, var(--accent), var(--primary))`
								}}>
									JC
								</div>
								<div>
									<p className="font-semibold">James Chen</p>
									<p className="text-sm text-[var(--muted)]">Creative Director</p>
								</div>
							</div>
							<p className="text-[var(--foreground)] opacity-90 italic leading-relaxed">
								&quot;The best tool for visual thinking. My team loves how easy it is to collaborate and share ideas.&quot;
							</p>
						</div>

						{/* Testimonial 3 */}
						<div className="bg-[var(--secondary)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-8">
							<div className="flex items-center mb-6">
								<div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold mr-4" style={{
									background: `linear-gradient(to bottom right, var(--primary), var(--accent))`
								}}>
									ER
								</div>
								<div>
									<p className="font-semibold">Emma Rodriguez</p>
									<p className="text-sm text-[var(--muted)]">Marketing Manager</p>
								</div>
							</div>
							<p className="text-[var(--foreground)] opacity-90 italic leading-relaxed">
								&quot;Finally, a tool that lets me organize campaigns visually. Game changer for our marketing team!&quot;
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-6 relative overflow-hidden" style={{
				background: `linear-gradient(to bottom right, var(--primary), var(--accent))`
			}}>
				<div className="absolute inset-0 opacity-10" style={{
					backgroundImage: `
						linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
						linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)
					`,
					backgroundSize: '50px 50px'
				}}></div>

				<div className="max-w-4xl mx-auto text-center relative z-10">
					<h2 className="text-4xl md:text-6xl font-bold mb-6">
						Ready to Get Started?
					</h2>
					<p className="text-xl mb-10 opacity-90">
						Join thousands of creative teams using Milanote to bring their ideas to life.
					</p>
					<a
						href="/auth"
						className="inline-block px-10 py-5 bg-[var(--background)] text-[var(--foreground)] rounded-lg font-bold text-lg hover:bg-[var(--card)] transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
					>
						Start Free Today
					</a>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-[var(--background)] border-t border-[var(--border)] py-12 px-6">
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
		</div>
	);
}
