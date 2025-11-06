import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";

export async function AuthButtons() {
	const supabase = await createClient();

	const { data } = await supabase.auth.getClaims();

	const user = data?.claims;

	return user ? (
		<div className="flex items-center gap-4">
			{user.displayName}
		</div>
	) : (
		<div className="flex gap-2">
			<Button asChild size="sm" variant={"outline"}>
				<Link href="/auth">Sign In</Link>
			</Button>
			<Button asChild size="sm" variant={"default"}>
				<Link href="/auth?mode=signup">Sign Up</Link>
			</Button>
		</div>
	)
}