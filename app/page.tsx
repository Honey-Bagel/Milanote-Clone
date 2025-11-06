'use client';

import Link from "next/link";

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-gray-900 text-white">
			{/* Navigation */}
			<nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
				<div className="max-w-7xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						{/* Logo */}
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
								<i className="fas fa-layer-group text-white text-lg"></i>
							</div>
							<span className="text-xl font-bold">Milanote</span>
						</div>

						{/* Navigation Links */}
						<div className="hidden md:flex items-center space-x-8">
							<a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
								Features
							</a>
							<a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
								How it Works
							</a>
							<a href="#testimonials" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
								Testimonials
							</a>
							<a href="#pricing" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
								Pricing
							</a>
						</div>

						{/* Auth Buttons */}
						<div className="flex items-center space-x-4">
							<Link
								href="/auth" 
								className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
							>
								Log In
							</Link>
							<Link
								href="/auth?mode=signup" 
								className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium text-sm hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
							>
								Sign Up Free
							</Link>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative pt-32 pb-20 px-6 overflow-hidden">
				{/* Background decorations */}
				<div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
				<div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 opacity-10 rounded-full blur-3xl"></div>
				
				{/* Grid pattern */}
				<div className="absolute inset-0 opacity-5" style={{
					backgroundImage: `
						linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
						linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
					`,
					backgroundSize: '50px 50px'
				}}></div>

				<div className="max-w-7xl mx-auto relative z-10">
					<div className="text-center max-w-4xl mx-auto">
						<h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
							Organize Your{' '}
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
								Creative Projects
							</span>{' '}
							Visually
						</h1>
						<p className="text-xl text-gray-400 mb-10 leading-relaxed">
							The tool for organizing creative projects into beautiful visual boards. 
							Collect inspiration, organize ideas, and build stunning mood boards.
						</p>
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
							<a 
								href="/auth" 
								className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
							>
								Start for Free
							</a>
							<button className="px-8 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white font-semibold text-lg hover:bg-gray-750 hover:border-gray-600 transition-all">
								Watch Demo
								<i className="fas fa-play ml-2 text-sm"></i>
							</button>
						</div>
						<p className="text-sm text-gray-500 mt-6">
							No credit card required • Free forever plan available
						</p>
					</div>

					{/* Hero Image/Dashboard Preview */}
					<div className="mt-20 relative">
						<div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10"></div>
						<div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl transform perspective-1000 rotate-x-2">
							<div className="aspect-video bg-gradient-to-br from-gray-800 via-gray-900 to-black p-8 flex items-center justify-center">
								<div className="text-center">
									<i className="fas fa-image text-gray-600 text-6xl mb-4"></i>
									<p className="text-gray-500">Dashboard Preview</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-20 px-6 bg-gray-900">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							Everything You Need
						</h2>
						<p className="text-xl text-gray-400">
							Powerful features to bring your creative vision to life
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{/* Feature 1 */}
						<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800 transition-all hover:border-gray-600 group">
							<div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
								<i className="fas fa-palette text-blue-400 text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Visual Workspace</h3>
							<p className="text-gray-400 leading-relaxed">
								Create beautiful boards with notes, images, tasks, links, and files. Drag, drop, and arrange everything visually.
							</p>
						</div>

						{/* Feature 2 */}
						<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800 transition-all hover:border-gray-600 group">
							<div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
								<i className="fas fa-users text-purple-400 text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Real-time Collaboration</h3>
							<p className="text-gray-400 leading-relaxed">
								Work together with your team in real-time. Share boards, leave comments, and see changes instantly.
							</p>
						</div>

						{/* Feature 3 */}
						<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800 transition-all hover:border-gray-600 group">
							<div className="w-14 h-14 bg-pink-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
								<i className="fas fa-mobile-alt text-pink-400 text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Access Anywhere</h3>
							<p className="text-gray-400 leading-relaxed">
								Cloud-synced across all devices. Work on desktop, tablet, or mobile. Your boards are always up to date.
							</p>
						</div>

						{/* Feature 4 */}
						<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800 transition-all hover:border-gray-600 group">
							<div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
								<i className="fas fa-search text-green-400 text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Powerful Search</h3>
							<p className="text-gray-400 leading-relaxed">
								Find anything instantly. Search across all your boards, notes, and files with lightning-fast results.
							</p>
						</div>

						{/* Feature 5 */}
						<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800 transition-all hover:border-gray-600 group">
							<div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
								<i className="fas fa-layer-group text-yellow-400 text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Flexible Organization</h3>
							<p className="text-gray-400 leading-relaxed">
								Organize with columns, sections, and nested boards. Structure your work exactly how you want it.
							</p>
						</div>

						{/* Feature 6 */}
						<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800 transition-all hover:border-gray-600 group">
							<div className="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
								<i className="fas fa-lock text-indigo-400 text-2xl"></i>
							</div>
							<h3 className="text-2xl font-bold mb-4">Secure & Private</h3>
							<p className="text-gray-400 leading-relaxed">
								Your data is encrypted and secure. Control who sees your boards with granular privacy settings.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section id="how-it-works" className="py-20 px-6 bg-gradient-to-b from-gray-900 to-gray-800">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							How It Works
						</h2>
						<p className="text-xl text-gray-400">
							Get started in minutes
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-12">
						{/* Step 1 */}
						<div className="text-center">
							<div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
								1
							</div>
							<h3 className="text-2xl font-bold mb-4">Create a Board</h3>
							<p className="text-gray-400 leading-relaxed">
								Start with a blank canvas or choose from beautiful templates designed for various projects.
							</p>
						</div>

						{/* Step 2 */}
						<div className="text-center">
							<div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
								2
							</div>
							<h3 className="text-2xl font-bold mb-4">Add Your Content</h3>
							<p className="text-gray-400 leading-relaxed">
								Drag and drop notes, images, links, tasks, and files. Arrange them visually however you like.
							</p>
						</div>

						{/* Step 3 */}
						<div className="text-center">
							<div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
								3
							</div>
							<h3 className="text-2xl font-bold mb-4">Share & Collaborate</h3>
							<p className="text-gray-400 leading-relaxed">
								Invite your team, share with clients, or keep it private. Collaborate in real-time effortlessly.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section id="testimonials" className="py-20 px-6 bg-gray-800">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							Loved by Creative Teams
						</h2>
						<p className="text-xl text-gray-400">
							See what our users have to say
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{/* Testimonial 1 */}
						<div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
							<div className="flex items-center mb-6">
								<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
									SM
								</div>
								<div>
									<p className="font-semibold">Sarah Mitchell</p>
									<p className="text-sm text-gray-400">Product Designer</p>
								</div>
							</div>
							<p className="text-gray-300 italic leading-relaxed">
								&quot;Milanote has completely transformed how I organize my design projects. It&apos;s intuitive and beautiful.&quot;
							</p>
						</div>

						{/* Testimonial 2 */}
						<div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
							<div className="flex items-center mb-6">
								<div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
									JC
								</div>
								<div>
									<p className="font-semibold">James Chen</p>
									<p className="text-sm text-gray-400">Creative Director</p>
								</div>
							</div>
							<p className="text-gray-300 italic leading-relaxed">
								&quot;The best tool for visual thinking. My team loves how easy it is to collaborate and share ideas.&quot;
							</p>
						</div>

						{/* Testimonial 3 */}
						<div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
							<div className="flex items-center mb-6">
								<div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
									ER
								</div>
								<div>
									<p className="font-semibold">Emma Rodriguez</p>
									<p className="text-sm text-gray-400">Marketing Manager</p>
								</div>
							</div>
							<p className="text-gray-300 italic leading-relaxed">
								&quot;Finally, a tool that lets me organize campaigns visually. Game changer for our marketing team!&quot;
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
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
					<p className="text-xl mb-10 text-white/90">
						Join thousands of creative teams using Milanote to bring their ideas to life.
					</p>
					<a 
						href="/auth" 
						className="inline-block px-10 py-5 bg-white text-gray-900 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
					>
						Start Free Today
					</a>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 border-t border-gray-800 py-12 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="grid md:grid-cols-4 gap-8 mb-8">
						{/* Company */}
						<div>
							<div className="flex items-center space-x-3 mb-4">
								<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
									<i className="fas fa-layer-group text-white text-sm"></i>
								</div>
								<span className="text-lg font-bold">Milanote</span>
							</div>
							<p className="text-gray-400 text-sm">
								The visual workspace for creative projects.
							</p>
						</div>

						{/* Product */}
						<div>
							<h4 className="font-semibold mb-4">Product</h4>
							<ul className="space-y-2 text-sm text-gray-400">
								<li><a href="#" className="hover:text-white transition-colors">Features</a></li>
								<li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
								<li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
								<li><a href="#" className="hover:text-white transition-colors">Security</a></li>
							</ul>
						</div>

						{/* Company */}
						<div>
							<h4 className="font-semibold mb-4">Company</h4>
							<ul className="space-y-2 text-sm text-gray-400">
								<li><a href="#" className="hover:text-white transition-colors">About</a></li>
								<li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
								<li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
								<li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
							</ul>
						</div>

						{/* Legal */}
						<div>
							<h4 className="font-semibold mb-4">Legal</h4>
							<ul className="space-y-2 text-sm text-gray-400">
								<li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
								<li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
								<li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
								<li><a href="#" className="hover:text-white transition-colors">Licenses</a></li>
							</ul>
						</div>
					</div>

					{/* Bottom Bar */}
					<div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
						<p className="text-gray-400 text-sm mb-4 md:mb-0">
							© 2024 Milanote. All rights reserved.
						</p>
						<div className="flex items-center space-x-6">
							<a href="#" className="text-gray-400 hover:text-white transition-colors">
								<i className="fab fa-twitter text-xl"></i>
							</a>
							<a href="#" className="text-gray-400 hover:text-white transition-colors">
								<i className="fab fa-facebook text-xl"></i>
							</a>
							<a href="#" className="text-gray-400 hover:text-white transition-colors">
								<i className="fab fa-instagram text-xl"></i>
							</a>
							<a href="#" className="text-gray-400 hover:text-white transition-colors">
								<i className="fab fa-linkedin text-xl"></i>
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}