"use client";

import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthPage() {
	const { isSignedIn } = useAuth();
	const searchParams = useSearchParams();
	const router = useRouter();

	const [isLogin, setIsLogin] = useState(
		searchParams.get("mode") !== "signup"
	);

	useEffect(() => {
		if (isSignedIn) redirect("/dashboard");
	}, [isSignedIn]);

	const switchMode = (login: boolean) => {
		setIsLogin(login);
		router.replace(login ? "/auth" : "/auth?mode=signup");
	};

	return (
		<>
			{/* Toggle */}
			<div className="flex bg-[#0f172a] border border-white/10 rounded-xl p-1 mb-6">
				<button
					onClick={() => switchMode(true)}
					className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
						isLogin
							? "bg-primary text-white"
							: "text-secondary-foreground hover:text-white"
					}`}
				>
					Login
				</button>
				<button
					onClick={() => switchMode(false)}
					className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
						!isLogin
							? "bg-primary text-white"
							: "text-secondary-foreground hover:text-white"
					}`}
				>
					Sign Up
				</button>
			</div>

			{isLogin ? (
				<SignIn
					routing="path"
					path="/auth"
					signUpUrl="/auth?mode=signup"
					appearance={clerkAppearance}
				/>
			) : (
				<SignUp
					routing="path"
					path="/auth"
					signInUrl="/auth"
					appearance={clerkAppearance}
				/>
			)}
		</>
	);
}

const clerkAppearance = {
	elements: {
		rootBox: "w-full",
		card: "bg-transparent shadow-none",
		headerTitle: "hidden",
		headerSubtitle: "hidden",
		socialButtonsBlockButton:
			"bg-[#0f172a] border-white/10 hover:bg-white/5",
		formButtonPrimary:
			"bg-gradient-to-r from-primary to-purple-600 hover:opacity-90",
		formFieldInput: "bg-[#0f172a] border-white/10 text-white",
		formFieldLabel: "text-secondary-foreground",
		footerActionLink: "text-primary",
	},
};
