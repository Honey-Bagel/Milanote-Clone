'use client';

import { useState, useEffect } from 'react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Layers, User, Mail, Lock, Eye, EyeOff, Palette, Users, Cloud, Github } from 'lucide-react';

export default function AuthPage() {
	const searchParams = useSearchParams();
	const [isLogin, setIsLogin] = useState(true);

	const supabase = createClient();

	useEffect(() => {
		const checkAuth = async () => {
			const { data: { user }, error } = await supabase.auth.getUser();

			if (!error && user) {
				redirect("/dashboard");
			}

		};

		checkAuth();
	});

	useEffect(() => {
		// Check if url has ?mode=signup
		if (searchParams.get('mode') === 'signup') {
			setIsLogin(false);
		}
	}, [searchParams]);

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	// Form state
	const [formData, setFormData] = useState({
		displayName: '',
		email: '',
		password: '',
		confirmPassword: '',
		agreeToTerms: false,
	});

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const supabase = createClient();

		try {
			if (isLogin) {
				// Login flow
				const { error } = await supabase.auth.signInWithPassword({
					email: formData.email,
					password: formData.password,
				});
				if (error) throw error;
				router.push('/dashboard');
			} else {
				// Sign up flow
				if (formData.password !== formData.confirmPassword) {
					throw new Error('Passwords do not match');
				}
				if (!formData.agreeToTerms) {
					throw new Error('Please agree to the Terms of Service');
				}

				const { error } = await supabase.auth.signUp({
					email: formData.email,
					password: formData.password,
					options: {
						data: {
							display_name: formData.displayName,
						},
					},
				});
				if (error) throw error;
				router.push('/auth/sign-up-success');
			}
		} catch (error: unknown) {
			setError(error instanceof Error ? error.message : 'An error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSocialAuth = async (provider: 'google' | 'github') => {
		setIsLoading(true);
		setError(null);
		const supabase = createClient();

		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});
			if (error) throw error;
		} catch (error: unknown) {
			setError(error instanceof Error ? error.message : 'An error occurred');
			setIsLoading(false);
		}
	};

	return (
		<div className="h-screen flex bg-[#020617] overflow-hidden">
			{/* Left Side - Auth Form */}
			<div className="flex-1 flex items-center justify-center p-6 bg-[#020617]">
				<div className="w-full max-w-md">
					{/* Logo */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl mb-4 shadow-lg shadow-indigo-500/20">
							<Layers size={24} className="text-white"/>
						</div>
						<h1 className="text-3xl font-bold text-white">CanvasOne</h1>
						<p className="text-slate-400 mt-2 text-sm">Your visual workspace</p>
					</div>

					{/* Tab Switcher */}
					<div className="flex bg-[#0f172a] border border-white/10 rounded-xl p-1 mb-6">
						<button
							type="button"
							onClick={() => {
								setIsLogin(true);
								setError(null);
							}}
							className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${
								isLogin
									? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
									: 'text-slate-400 hover:text-white'
							}`}
						>
							Login
						</button>
						<button
							type="button"
							onClick={() => {
								setIsLogin(false);
								setError(null);
							}}
							className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${
								!isLogin
									? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
									: 'text-slate-400 hover:text-white'
							}`}
						>
							Sign Up
						</button>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Name Field - Only for Signup */}
						{!isLogin && (
							<div>
								<Label
									htmlFor="displayName"
									className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2"
								>
									Display Name
								</Label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<User size={16} className="text-slate-500"/>
									</div>
									<Input
										id="displayName"
										type="text"
										placeholder="ReallyCoolUser2"
										value={formData.displayName}
										onChange={(e) => handleInputChange('displayName', e.target.value)}
										required={!isLogin}
										className="w-full pl-11 pr-4 py-3 bg-[#0f172a] border border-white/10 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder-slate-500 transition-all"
									/>
								</div>
							</div>
						)}

						{/* Email Field */}
						<div>
							<Label
								htmlFor="email"
								className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2"
							>
								Email Address
							</Label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<Mail size={16} className="text-slate-500"/>
								</div>
								<Input
									id="email"
									type="email"
									placeholder="cooluser@example.com"
									value={formData.email}
									onChange={(e) => handleInputChange('email', e.target.value)}
									required
									className="w-full pl-11 pr-4 py-3 bg-[#0f172a] border border-white/10 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder-slate-500 transition-all"
								/>
							</div>
						</div>

						{/* Password Field */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<Label
									htmlFor="password"
									className="block text-sm font-bold text-slate-400 uppercase tracking-wider"
								>
									Password
								</Label>
								{isLogin && (
									<Link
										href="/auth/forgot-password"
										className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
									>
										Forgot password?
									</Link>
								)}
							</div>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<Lock size={16} className="text-slate-500"/>
								</div>
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="••••••••"
									value={formData.password}
									onChange={(e) => handleInputChange('password', e.target.value)}
									required
									className="w-full pl-11 pr-12 py-3 bg-[#0f172a] border border-white/10 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder-slate-500 transition-all"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
								>
									{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
						</div>

						{/* Confirm Password - Only for Signup */}
						{!isLogin && (
							<div>
								<Label
									htmlFor="confirmPassword"
									className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2"
								>
									Confirm Password
								</Label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<Lock size={16} className="text-slate-500"/>
									</div>
									<Input
										id="confirmPassword"
										type={showConfirmPassword ? 'text' : 'password'}
										placeholder="••••••••"
										value={formData.confirmPassword}
										onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
										required={!isLogin}
										className="w-full pl-11 pr-12 py-3 bg-[#0f172a] border border-white/10 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder-slate-500 transition-all"
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
									>
										{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
							</div>
						)}

						{/* Terms - Only for Signup */}
						{!isLogin && (
							<div className="flex items-start pt-2">
								<div className="flex items-start gap-3">
									<div className="relative mt-0.5">
										<Checkbox
											id="terms"
											checked={formData.agreeToTerms}
											onCheckedChange={(checked) =>
												handleInputChange('agreeToTerms', checked as boolean)
											}
											className="border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
										/>
									</div>
									<Label
										htmlFor="terms"
										className="text-xs text-slate-400 leading-relaxed cursor-pointer"
									>
										I agree to the{' '}
										<a href="#" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
											Terms of Service
										</a>{' '}
										and{' '}
										<a href="#" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
											Privacy Policy
										</a>
									</Label>
								</div>
							</div>
						)}

						{/* Error Message */}
						{error && (
							<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
								<p className="text-sm text-red-400">{error}</p>
							</div>
						)}

						{/* Submit Button */}
						<Button
							type="submit"
							disabled={isLoading}
							className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
						>
							{isLoading ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									Processing...
								</div>
							) : isLogin ? 'Sign In' : 'Create Account'}
						</Button>
					</form>

					{/* Divider */}
					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-white/10"></div>
						</div>
						<div className="relative flex justify-center text-xs">
							<span className="px-3 bg-[#020617] text-slate-500 uppercase tracking-wider">Or continue with</span>
						</div>
					</div>

					{/* Social Login Buttons */}
					<div className="grid grid-cols-2 gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => handleSocialAuth('google')}
							disabled={isLoading}
							className="flex items-center justify-center py-3 px-4 bg-[#0f172a] border border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20 disabled:opacity-50 rounded-lg transition-all"
						>
							<svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
								<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
								<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
								<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
								<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
							</svg>
							<span className="text-sm font-medium">Google</span>
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleSocialAuth('github')}
							disabled={isLoading}
							className="flex items-center justify-center py-3 px-4 bg-[#0f172a] border border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20 disabled:opacity-50 rounded-lg transition-all"
						>
							<Github size={20} className="mr-2" />
							<span className="text-sm font-medium">Github</span>
						</Button>
					</div>

					{/* Footer Text */}
					<p className="text-center text-xs text-slate-500 mt-6">
						{isLogin ? "Don't have an account? " : 'Already have an account? '}
						<button
							type="button"
							onClick={() => {
								setIsLogin(!isLogin);
								setError(null);
							}}
							className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
						>
							{isLogin ? 'Sign up for free' : 'Sign in'}
						</button>
					</p>
				</div>
			</div>

			{/* Right Side - Feature Showcase */}
			<div className="hidden lg:flex flex-1 bg-[#0f172a] p-12 items-center justify-center relative overflow-hidden">
				{/* Decorative elements */}
				<div className="absolute top-20 right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
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
					<p className="text-xl text-slate-400 mb-12 leading-relaxed">
						CanvasOne is an intuitive tool to organize your ideas and projects into beautiful visual boards.
					</p>

					{/* Features */}
					<div className="space-y-6">
						<div className="flex items-start gap-4 group">
							<div className="flex-shrink-0 w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center group-hover:bg-indigo-600/30 transition-all">
								<Palette size={24} className="text-indigo-400"/>
							</div>
							<div>
								<h3 className="font-bold text-lg mb-1 text-white">Visual Workspace</h3>
								<p className="text-slate-400 text-sm leading-relaxed">
									Create beautiful boards with notes, images, tasks, and more.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4 group">
							<div className="flex-shrink-0 w-12 h-12 bg-cyan-600/20 border border-cyan-500/30 rounded-xl flex items-center justify-center group-hover:bg-cyan-600/30 transition-all">
								<Users size={24} className="text-cyan-400"/>
							</div>
							<div>
								<h3 className="font-bold text-lg mb-1 text-white">Collaborate in Real-time</h3>
								<p className="text-slate-400 text-sm leading-relaxed">
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
								<p className="text-slate-400 text-sm leading-relaxed">
									Access your boards from anywhere, on any device, always in sync.
								</p>
							</div>
						</div>
					</div>

					{/* Testimonial */}
					<div className="mt-12 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/20 transition-all">
						<div className="flex items-center mb-4">
							<div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center font-bold text-white mr-4 shadow-lg">
								SM
							</div>
							<div>
								<p className="font-semibold text-white">Sarah Mitchell</p>
								<p className="text-sm text-slate-400">Product Designer at Figma</p>
							</div>
						</div>
						<p className="text-slate-300 italic leading-relaxed">
							&quot;CanvasOne has completely transformed how I organize my design projects. It&apos;s intuitive, beautiful, and incredibly powerful.&quot;
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}