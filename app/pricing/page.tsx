"use client";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PricingContent } from "@/components/billing/PricingContent";

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-[#020617]">
			<LandingNavbar />

			<main className="pt-24">
				<PricingContent variant="modal" />
			</main>

			<LandingFooter />
		</div>
	);
}