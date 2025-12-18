'use client';

import { db } from "@/lib/instant/db";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { syncUserToInstantDB } from "./UserSync";

// If a user is signed in with Clerk, sign them in with InstantDB
export default function InstantDBAuthSync() {
	const { isSignedIn, user, isLoaded } = useUser();
	const { getToken } = useAuth();

	useEffect(() => {
		if (isSignedIn) {
			getToken()
				.then((token) => {
					// Create a long-lived session with Instant for your clerk user
					// It will look up the user by email or create a new user with
					// the email address in the session token.
					db.auth.signInWithIdToken({
						clientName: process.env.NEXT_PUBLIC_CLERK_CLIENT_NAME as string,
						idToken: token as string
					});
				})
				.catch((error) => {
					console.error('Error signing in with Instant', error);
				});
		} else {
			db.auth.signOut();
		}
	}, [isSignedIn, getToken]);

	useEffect(() => {
		if (isLoaded && user) {
			syncUserToInstantDB(user);
		}
	}, [isLoaded, user]);

	return null;
}