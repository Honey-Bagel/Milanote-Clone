'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

type AuthContextType = {
	user: User | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, displayName: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
	);

	useEffect(() => {
		const getUser = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			setUser(user);
			setLoading(false);
		};

		getUser();

		// Listen for auth changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				setUser(session?.user ?? null);
				setLoading(false);
			}
		);

		return () => {
			subscription.unsubscribe();
		};
	}, [supabase]);

	const signIn = async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		if (error) throw error;
		router.refresh();
	};

	const signUp = async (email: string, displayName: string, password: string) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					display_name: displayName,
				},
			},
		});
		if (error) throw error;
		router.refresh();
	};

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
		router.push('/auth');
		router.refresh();
	};

	return (
		<AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useUser must be used within AuthProvided");
	}
	return context;
};