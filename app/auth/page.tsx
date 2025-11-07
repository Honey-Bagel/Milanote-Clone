'use client';

import { useState, useEffect } from 'react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

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
				router.push('/dashboard');
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
		<div className="h-screen flex bg-gray-900 overflow-hidden">
			{/* Left Side - Auth Form */}
			<div className="flex-1 flex items-center justify-center p-6 bg-gray-900">
				<div className="w-full max-w-md">
					{/* Logo */}
					<div className="text-center mb-5">
						<div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-3">
							<i className="fas fa-layer-group text-white text-lg"></i>
						</div>
						<h1 className="text-2xl font-bold text-white">Milanote</h1>
						<p className="text-gray-400 mt-1 text-sm">Your visual workspace</p>
					</div>

					{/* Tab Switcher */}
					<div className="flex bg-gray-800 rounded-lg p-1 mb-5">
						<button
							type="button"
							onClick={() => {
								setIsLogin(true);
								setError(null);
							}}
							className={`flex-1 py-2 px-4 rounded-md font-medium transition-all text-sm ${
								isLogin
									? 'bg-gray-700 text-white shadow-sm'
									: 'text-gray-400 hover:text-gray-200'
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
							className={`flex-1 py-2 px-4 rounded-md font-medium transition-all text-sm ${
								!isLogin
									? 'bg-gray-700 text-white shadow-sm'
									: 'text-gray-400 hover:text-gray-200'
							}`}
						>
							Sign Up
						</button>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-3">
						{/* Name Field - Only for Signup */}
						{!isLogin && (
							<div>
								<Label
									htmlFor="displayName"
									className="block text-sm font-medium text-gray-300 mb-1.5"
								>
									Display Name
								</Label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<i className="fas fa-user text-gray-500 text-sm"></i>
									</div>
									<Input
										id="displayName"
										type="text"
										placeholder="ReallyCoolUser2"
										value={formData.displayName}
										onChange={(e) => handleInputChange('displayName', e.target.value)}
										required={!isLogin}
										className="w-full pl-3 pr-4 py-2.5 bg-gray-800 border-gray-700 text-white text-sm placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
							</div>
						)}

						{/* Email Field */}
						<div>
							<Label
								htmlFor="email"
								className="block text-sm font-medium text-gray-300 mb-1.5"
							>
								Email Address
							</Label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<i className="fas fa-envelope text-gray-500 text-sm"></i>
								</div>
								<Input
									id="email"
									type="email"
									placeholder="cooluser@example.com"
									value={formData.email}
									onChange={(e) => handleInputChange('email', e.target.value)}
									required
									className="w-full pl-3 pr-4 py-2.5 bg-gray-800 border-gray-700 text-white text-sm placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						</div>

						{/* Password Field */}
						<div>
							<div className="flex items-center">
								<Label
									htmlFor="password"
									className="block text-sm font-medium text-gray-300 mb-1.5"
								>
									Password
								</Label>
								{isLogin && (
									<Link
										href="/auth/forgot-password"
										className="ml-auto inline-block text-xs underline-offset-4 hover:underline"
									>
										Forgot your password?
									</Link>
								)}
							</div>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<i className="fas fa-lock text-gray-500 text-sm"></i>
								</div>
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="••••••••"
									value={formData.password}
									onChange={(e) => handleInputChange('password', e.target.value)}
									required
									className="w-full pl-3 pr-10 py-2.5 bg-gray-800 border-gray-700 text-white text-sm placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
								>
									<i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
								</button>
							</div>
						</div>

						{/* Confirm Password - Only for Signup */}
						{!isLogin && (
							<div>
								<Label
									htmlFor="confirmPassword"
									className="block text-sm font-medium text-gray-300 mb-1.5"
								>
									Confirm Password
								</Label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<i className="fas fa-lock text-gray-500 text-sm"></i>
									</div>
									<Input
										id="confirmPassword"
										type={showConfirmPassword ? 'text' : 'password'}
										placeholder="••••••••"
										value={formData.confirmPassword}
										onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
										required={!isLogin}
										className="w-full pl-3 pr-10 py-2.5 bg-gray-800 border-gray-700 text-white text-sm placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
									>
										<i
											className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}
										></i>
									</button>
								</div>
							</div>
						)}

						{/* Terms - Only for Signup */}
						{!isLogin && (
							<div className="flex items-start pt-1">
								<div className="flex items-start">
									<Checkbox
										id="terms"
										checked={formData.agreeToTerms}
										onCheckedChange={(checked) =>
											handleInputChange('agreeToTerms', checked as boolean)
										}
										className="mt-0.5 border-gray-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
									/>
									<Label
										htmlFor="terms"
										className="ml-2 text-xs text-gray-400 leading-tight cursor-pointer"
									>
										I agree to the{' '}
										<a href="#" className="text-blue-400 hover:text-blue-300 font-medium">
											Terms of Service
										</a>{' '}
										and{' '}
										<a href="#" className="text-blue-400 hover:text-blue-300 font-medium">
											Privacy Policy
										</a>
									</Label>
								</div>
							</div>
						)}

						{/* Error Message */}
						{error && (
							<div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
								<p className="text-sm text-red-400">{error}</p>
							</div>
						)}

						{/* Submit Button */}
						<Button
							type="submit"
							disabled={isLoading}
							className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
						>
							{isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
						</Button>
					</form>

					{/* Divider */}
					<div className="relative my-5">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-700"></div>
						</div>
						<div className="relative flex justify-center text-xs">
							<span className="px-3 bg-gray-900 text-gray-500">Or continue with</span>
						</div>
					</div>

					{/* Social Login Buttons */}
					<div className="grid grid-cols-2 gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => handleSocialAuth('google')}
							disabled={isLoading}
							className="flex items-center justify-center py-2.5 px-4 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-600 hover:text-white disabled:opacity-50"
						>
							<i className="fab fa-google text-lg mr-2"></i>
							<span className="text-sm">Google</span>
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleSocialAuth('github')}
							disabled={isLoading}
							className="flex items-center justify-center py-2.5 px-4 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-600 hover:text-white disabled:opacity-50"
						>
							<i className="fab fa-github text-lg mr-2"></i>
							<span className="text-sm">Github</span>
						</Button>
					</div>

					{/* Footer Text */}
					<p className="text-center text-xs text-gray-400 mt-5">
						{isLogin ? "Don't have an account? " : 'Already have an account? '}
						<button
							type="button"
							onClick={() => {
								setIsLogin(!isLogin);
								setError(null);
							}}
							className="text-blue-400 hover:text-blue-300 font-medium"
						>
							{isLogin ? 'Sign up for free' : 'Sign in'}
						</button>
					</p>
				</div>
			</div>

			{/* Right Side - Feature Showcase */}
			<div className="hidden lg:flex flex-1 bg-gradient-to-br from-gray-800 via-gray-900 to-black p-12 items-center justify-center relative overflow-hidden">
				{/* Decorative elements */}
				<div className="absolute top-20 right-20 w-72 h-72 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
				<div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500 opacity-10 rounded-full blur-3xl"></div>

				{/* Grid pattern overlay */}
				<div
					className="absolute inset-0 opacity-10"
					style={{
						backgroundImage: `
						linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
						linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
					`,
						backgroundSize: '50px 50px',
					}}
				></div>

				<div className="relative z-10 text-white max-w-lg">
					<h2 className="text-5xl font-bold mb-6">
						Organize your creative projects visually
					</h2>
					<p className="text-xl text-gray-300 mb-12">
						Milanote is an easy-to-use tool to organize your ideas and projects into visual
						boards.
					</p>

					{/* Features */}
					<div className="space-y-6">
						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-blue-500/30">
								<i className="fas fa-palette text-blue-400 text-2xl"></i>
							</div>
							<div>
								<h3 className="font-semibold text-lg mb-1">Visual Workspace</h3>
								<p className="text-gray-400 text-sm">
									Create beautiful boards with notes, images, tasks, and more.
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-purple-500/30">
								<i className="fas fa-users text-purple-400 text-2xl"></i>
							</div>
							<div>
								<h3 className="font-semibold text-lg mb-1">Collaborate in Real-time</h3>
								<p className="text-gray-400 text-sm">
									Work together with your team, share boards, and get feedback instantly.
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0 w-12 h-12 bg-pink-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-pink-500/30">
								<i className="fas fa-cloud text-pink-400 text-2xl"></i>
							</div>
							<div>
								<h3 className="font-semibold text-lg mb-1">Cloud Sync</h3>
								<p className="text-gray-400 text-sm">
									Access your boards from anywhere, on any device, always in sync.
								</p>
							</div>
						</div>
					</div>

					{/* Testimonial */}
					<div className="mt-12 p-6 bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50">
						<div className="flex items-center mb-4">
							<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
								SM
							</div>
							<div>
								<p className="font-semibold text-white">Sarah Mitchell</p>
								<p className="text-sm text-gray-400">Product Designer at Figma</p>
							</div>
						</div>
						<p className="text-gray-300 italic">
							&quot;Milanote has completely transformed how I organize my design projects.
							It&apos;s intuitive, beautiful, and incredibly powerful.&quot;
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}