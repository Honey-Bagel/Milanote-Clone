'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { SignIn, SignUp } from '@clerk/nextjs';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layers, Palette, Users, Cloud } from 'lucide-react';

export default function AuthPage() {
	const searchParams = useSearchParams();
	const [isLogin, setIsLogin] = useState(true);
	const { isSignedIn } = useAuth();

	useEffect(() => {
		// Redirect if already signed in
		if (isSignedIn) {
			redirect("/dashboard");
		}
	}, [isSignedIn]);

	useEffect(() => {
		// Check if url has ?mode=signup
		if (searchParams.get('mode') === 'signup') {
			setIsLogin(false);
		}
	}, [searchParams]);

	return (
		<div className="h-screen flex bg-[#020617] overflow-hidden">
			{/* Left Side - Auth Form */}
			<div className="flex-1 flex items-center justify-center p-6 bg-[#020617]">
				<div className="w-full max-w-md">
					{/* Logo */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl mb-4 shadow-lg shadow-primary/20">
							<Layers size={24} className="text-white"/>
						</div>
						<h1 className="text-3xl font-bold text-white">CanvasOne</h1>
						<p className="text-secondary-foreground mt-2 text-sm">Your visual workspace</p>
					</div>

					{/* Tab Switcher */}
					<div className="flex bg-[#0f172a] border border-white/10 rounded-xl p-1 mb-6">
						<button
							type="button"
							onClick={() => setIsLogin(true)}
							className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${
								isLogin
									? 'bg-primary text-white shadow-lg shadow-primary/20'
									: 'text-secondary-foreground hover:text-white'
							}`}
						>
							Login
						</button>
						<button
							type="button"
							onClick={() => setIsLogin(false)}
							className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${
								!isLogin
									? 'bg-primary text-white shadow-lg shadow-primary/20'
									: 'text-secondary-foreground hover:text-white'
							}`}
						>
							Sign Up
						</button>
					</div>

					{/* Clerk Auth Components */}
					<div className="clerk-auth-wrapper">
						{isLogin ? (
							<SignIn
								appearance={{
									elements: {
										rootBox: "w-full",
										card: "bg-transparent shadow-none",
										headerTitle: "hidden",
										headerSubtitle: "hidden",
										socialButtonsBlockButton: "bg-[#0f172a] border-white/10 text-foreground hover:bg-white/5",
										formButtonPrimary: "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-500",
										formFieldInput: "bg-[#0f172a] border-white/10 text-white",
										formFieldLabel: "text-secondary-foreground",
										footerActionLink: "text-primary hover:text-primary/80",
										identityPreviewText: "text-white",
										formResendCodeLink: "text-primary hover:text-primary/80",
									},
								}}
								routing="path"
								path="/auth"
								signUpUrl="/auth?mode=signup"
							/>
						) : (
							<SignUp
								appearance={{
									elements: {
										rootBox: "w-full",
										card: "bg-transparent shadow-none",
										headerTitle: "hidden",
										headerSubtitle: "hidden",
										socialButtonsBlockButton: "bg-[#0f172a] border-white/10 text-foreground hover:bg-white/5",
										formButtonPrimary: "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-500",
										formFieldInput: "bg-[#0f172a] border-white/10 text-white",
										formFieldLabel: "text-secondary-foreground",
										footerActionLink: "text-primary hover:text-primary/80",
										identityPreviewText: "text-white",
										formResendCodeLink: "text-primary hover:text-primary/80",
									},
								}}
								routing="path"
								path="/auth"
								signInUrl="/auth"
							/>
						)}
					</div>
				</div>
			</div>

			{/* Right Side - Feature Showcase */}
			<div className="hidden lg:flex flex-1 bg-[#0f172a] p-12 items-center justify-center relative overflow-hidden">
				{/* Decorative elements */}
				<div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
				<div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl"></div>

				{/* Grid pattern overlay */}
				<div
					className="absolute inset-0 opacity-[0.02]"
					style={{
						backgroundImage: `
						linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
						linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
					`,
						backgroundSize: '50px 50px',
					}}
				></div>

				<div className="relative z-10 text-white max-w-lg">
					<h2 className="text-5xl font-bold mb-6 leading-tight">
						Organize your creative projects visually
					</h2>
					<p className="text-xl text-secondary-foreground mb-12 leading-relaxed">
						CanvasOne is an intuitive tool to organize your ideas and projects into beautiful visual boards.
					</p>

					{/* Features */}
					<div className="space-y-6">
						<div className="flex items-start gap-4 group">
							<div className="flex-shrink-0 w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center group-hover:bg-primary/30 transition-all">
								<Palette size={24} className="text-primary"/>
							</div>
							<div>
								<h3 className="font-bold text-lg mb-1 text-white">Visual Workspace</h3>
								<p className="text-secondary-foreground text-sm leading-relaxed">
									Create beautiful boards with notes, images, tasks, and more.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4 group">
							<div className="flex-shrink-0 w-12 h-12 bg-accent/20 border border-accent/30 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-all">
								<Users size={24} className="text-accent"/>
							</div>
							<div>
								<h3 className="font-bold text-lg mb-1 text-white">Collaborate in Real-time</h3>
								<p className="text-secondary-foreground text-sm leading-relaxed">
									Work together with your team, share boards, and get feedback instantly.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4 group">
							<div className="flex-shrink-0 w-12 h-12 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center group-hover:bg-purple-600/30 transition-all">
								<Cloud size={24} className="text-purple-400"/>
							</div>
							<div>
								<h3 className="font-bold text-lg mb-1 text-white">Cloud Sync</h3>
								<p className="text-secondary-foreground text-sm leading-relaxed">
									Access your boards from anywhere, on any device, always in sync.
								</p>
							</div>
						</div>
					</div>

					{/* Testimonial */}
					<div className="mt-12 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/20 transition-all">
						<div className="flex items-center mb-4">
							<div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center font-bold text-white mr-4 shadow-lg">
								SM
							</div>
							<div>
								<p className="font-semibold text-white">Sarah Mitchell</p>
								<p className="text-sm text-secondary-foreground">Product Designer at Figma</p>
							</div>
						</div>
						<p className="text-foreground italic leading-relaxed">
							&quot;CanvasOne has completely transformed how I organize my design projects. It&apos;s intuitive, beautiful, and incredibly powerful.&quot;
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}