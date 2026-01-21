"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { StripeProvider } from "@/lib/stripe/stripe-provider";
import { VisuallyHidden } from "radix-ui";

interface UpdatePaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
};

function UpdatePaymentModalContent({
	isOpen,
	onClose,
	onSuccess,
}: UpdatePaymentModalProps) {
	const stripe = useStripe();
	const elements = useElements();
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements) {
			return;
		}

		setIsProcessing(true);
		setError(null);

		try {
			// Confirm the setup
			const { error: confirmError, setupIntent } = await stripe.confirmSetup({
				elements,
				redirect: 'if_required',
			});

			if (confirmError) {
				setError(confirmError.message || 'Payment setup failed');
				setIsProcessing(false);
				return;
			}

			if (setupIntent && setupIntent.payment_method) {
				// Update default payment method on backend
				const response = await fetch('/api/billing/payment-method-update', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						paymentMethodId: setupIntent.payment_method,
					}),
				});

				const data = await response.json();

				if (!response.ok || data.error) {
					throw new Error(data.error || 'Failed to update payment method');
				}

				onSuccess();
				onClose();
			}
		} catch (error) {
			console.error('Payment update error:', error);
			setError(error instanceof Error ? error.message : 'An error occurred');
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md bg-[#0b0e1b] border-white/10 text-white">
				<DialogHeader>
					<DialogTitle className="text-xl font-bold">
						Update Payment Method
					</DialogTitle>
					<DialogDescription className="text-secondary-foreground">
						Enter your new card details below. This will be your default payment method.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6 mt-4">
					<div className="p-4 bg-white/5 rounded-lg border border-white/10">
						<PaymentElement />
					</div>

					{error && (
						<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
							{error}
						</div>
					)}

					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							disabled={isProcessing}
							className="flex-1 px-4 py-2 bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors rounded-lg font-medium text-sm disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!stripe || isProcessing}
							className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
						>
							{isProcessing ? (
								<>
									<Loader2 size={16} className="animate-spin" />
									Processing...
								</>
							) : (
								'Update Payment Method'
							)}
						</button>
					</div>
				</form>

				<p className="text-xs text-secondary-foreground text-center mt-4">
					Your payment information is secured by Stripe. We never store your full card details.
				</p>
			</DialogContent>
		</Dialog>
	);
}

export function UpdatePaymentModal(props: UpdatePaymentModalProps) {
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const getSecret = () => {
			if (props.isOpen && !clientSecret) {
				setIsLoading(true);
				fetch('/api/billing/setup-intent', { method: 'POST' })
					.then((res) => res.json())
					.then((data) => {
						setClientSecret(data.clientSecret);
						setIsLoading(false);
					})
					.catch((err) => {
						console.error('Setup intent error:', err);
						setIsLoading(false);
					});
			}
		}
		getSecret();
	}, [props.isOpen, clientSecret]);

	if (!props.isOpen) return null;

	if (isLoading || !clientSecret) {
		return (
			<Dialog open={props.isOpen} onOpenChange={props.onClose}>
				<DialogContent className="max-w-md bg-[#0b0e1b] border-white/10 text-white">
					<VisuallyHidden.Root><DialogTitle></DialogTitle></VisuallyHidden.Root>
					<div className="flex items-center justify-center py-8">
						<Loader2 size={32} className="animate-spin text-primary" />
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<StripeProvider clientSecret={clientSecret}>
			<UpdatePaymentModalContent {...props} />
		</StripeProvider>
	)
}