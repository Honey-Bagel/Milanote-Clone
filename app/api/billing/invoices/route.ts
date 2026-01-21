import { NextResponse } from "next/server";
import Stripe from "stripe";
import { init } from "@instantdb/admin";
import { withRateLimitedAuth } from "@/lib/rate-limit/with-rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit/configs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-12-15.clover',
});

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export const GET = withRateLimitedAuth(
	async (user, req) => {
		try {
			// Get user's stripe customer ID
			const data = await adminDB.query({
				profiles: {
					$: { where: { id: user.id } },
				},
			});

			const profile = data.profiles[0];

			if (!profile.stripe_customer_id) {
				return NextResponse.json({ invoices: [] }, { status: 200 });
			}

			// Fetch invoices from Stripe
			const invoices = await stripe.invoices.list({
				customer: profile.stripe_customer_id,
				limit: 100,
			});

			const formattedInvoices = invoices.data.map((invoice) => ({
				id: invoice.id,
				number: invoice.number,
				amount: invoice.amount_paid / 100,
				currency: invoice.currency.toUpperCase(),
				status: invoice.status,
				created: invoice.created * 1000,
				pdfUrl: invoice.invoice_pdf,
				hostedUrl: invoice.hosted_invoice_url,
				periodStart: invoice.period_start * 1000,
				periodEnd: invoice.period_end * 1000,
			}));

			return NextResponse.json({ invoices: formattedInvoices });
		} catch (error) {
			console.error('[Invoices] Error:', error);
			return NextResponse.json(
				{ error: 'Failed to fetch invoices' },
				{ status: 500 }
			);
		}
	},
	RATE_LIMITS.BILLING_INVOICES,
	'billing-invoices'
)