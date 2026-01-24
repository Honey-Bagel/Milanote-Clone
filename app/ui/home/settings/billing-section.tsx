'use client';

import { useState } from 'react';
import { useUserUsage } from '@/lib/hooks/user/use-user-usage';
import { formatBytes } from '@/lib/utils';
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard';
import { CreditCard, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { TIER_LIMITS } from '@/lib/billing/tier-limits';
import { useUserPlan } from '@/lib/hooks/user/use-user-plan';
import { usePaymentMethod } from '@/lib/hooks/billing/use-payment-method';
import { useInvoices } from '@/lib/hooks/billing/use-invoices';
import { UpdatePaymentModal } from '@/components/billing/UpdatePaymentModal';
import { InvoicesModal } from '@/components/billing/InvoicesModal';
import { format } from 'date-fns';

const MAX_VISIBLE_INVOICES = 3;

export function BillingSection() {
	const { boardCount, fileUsage, isLoading, error } = useUserUsage();
	const { tier } = useUserPlan();
	const { paymentMethod, isLoading: isLoadingPayment, refresh: refreshPayment } = usePaymentMethod();
	const { invoices, isLoading: isLoadingInvoices } = useInvoices();
	const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
	const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);

	const limit = TIER_LIMITS[tier];
	const cardCount = 88;

	const handlePaymentUpdateSuccess = () => {
		refreshPayment();
	};

	return (
		<div className="h-full flex flex-col min-h-0">
			<div className="shrink-0 mb-6">
				<h3 className="text-lg font-bold text-white">Billing & Subscription</h3>
				<p className="text-sm text-secondary-foreground">Manage your subscription and usage limits.</p>
			</div>

			<div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-6">

				{/* LEFT COLUMN: Plan Details (60% width) */}
				<div className="lg:col-span-3">
					<CurrentPlanCard />
				</div>

				{/* RIGHT COLUMN: Sidebar Stack (40% width) */}
				<div className="lg:col-span-2 flex flex-col gap-4 min-h-0">

					{/* 1. Resource Usage */}
					<div className="p-5 bg-[#020617] border border-white/10 rounded-xl shadow-sm shrink-0">
						<div className="flex items-center justify-between mb-4">
							<h4 className="text-sm font-semibold text-white">Resource Usage</h4>
							<span className="text-[10px] font-medium text-secondary-foreground uppercase tracking-wider">
								Monthly Cycle
							</span>
						</div>

						{isLoading ? (
							<div className="space-y-4 animate-pulse">
								<div className="h-2 bg-white/5 rounded w-full"></div>
								<div className="h-2 bg-white/5 rounded w-3/4"></div>
							</div>
						) : error ? (
							 <div className="text-xs text-red-400 flex items-center gap-2">
								<AlertCircle size={14} /> Failed to load usage
							</div>
						) : (
							<div className="space-y-4">
								<UsageRow label="Boards Created" current={boardCount} max={limit.boards} format={(v) => v} color="bg-blue-500" />
								<UsageRow label="Total Cards" current={cardCount} max={limit.cards} format={(v) => v} color="bg-blue-500" />
								<UsageRow label="File Storage" current={fileUsage} max={limit.storageBytes} format={(v) => formatBytes(v, { base: 1000 })} color="bg-blue-500" />
							</div>
						)}
					</div>

					{/* 2. Payment & History */}
					<div className="p-6 bg-[#020617] border border-white/10 rounded-xl shadow-sm shrink-0">
						<div className="flex items-center justify-between mb-6">
							 <h4 className="text-base font-semibold text-white">Payment Method</h4>
							 <button onClick={() => setIsUpdateModalOpen(true)} className="text-xs text-primary hover:text-primary/80 transition-colors">Update</button>
						</div>
						
						{/* Credit Card Display */}
						{isLoadingPayment ? (
							<div className="h-16 bg-white/5 rounded-lg animate-pulse"></div>
						) : paymentMethod ? (
							<div className="flex items-start gap-4 mb-6">
								<div className="p-2.5 bg-white/5 rounded-lg border border-white/5 text-white shrink-0">
									<CreditCard size={20} />
								</div>
								<div className="flex-1">
									<div className="flex items-center justify-between">
										<p className="text-sm font-medium text-white capitalize">
											{paymentMethod.brand} ending in {paymentMethod.last4}
										</p>
										{paymentMethod.isDefault && (
											<span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">
												DEFAULT
											</span>
										)}
									</div>
									<p className="text-xs text-secondary-foreground mt-0.5">
										Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
									</p>
								</div>
							</div>
						) : (
							<div className="text-sm text-secondary-foreground mb-6">
								No payment method on file
							</div>
						)}

						<div className="space-y-3 pt-6 border-t border-white/5">
							<h5 className="text-[11px] font-semibold text-secondary-foreground uppercase tracking-wider mb-3">
								Recent Invoices
							</h5>

							{isLoadingInvoices ? (
								<div className="space-y-3">
									<div className="h-8 bg-white/5 rounded animate-pulse"></div>
									<div className="h-8 bg-white/5 rounded animate-pulse"></div>
								</div>
							) : invoices.length > 0 ? (
								<>
									<div className="space-y-3">
										{invoices.slice(0, MAX_VISIBLE_INVOICES).map((invoice) => (
											<InvoiceRow
												key={invoice.id}
												date={format(new Date(invoice.created), 'MMM d, yyyy')}
												amount={`$${invoice.amount.toFixed(2)}`}
												status={invoice.status}
												pdfUrl={invoice.pdfUrl}
											/>
										))}
									</div>
									{invoices.length > MAX_VISIBLE_INVOICES && (
										<button
											onClick={() => setIsInvoicesModalOpen(true)}
											className="w-full mt-4 py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
										>
											View all {invoices.length} invoices
										</button>
									)}
								</>
							) : (
								<p className="text-sm text-secondary-foreground">No invoices yet</p>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Update Payment Modal */}
			<UpdatePaymentModal
				isOpen={isUpdateModalOpen}
				onClose={() => setIsUpdateModalOpen(false)}
				onSuccess={handlePaymentUpdateSuccess}
			/>

			{/* Invoices Modal */}
			<InvoicesModal
				isOpen={isInvoicesModalOpen}
				onClose={() => setIsInvoicesModalOpen(false)}
				invoices={invoices}
			/>
		</div>
	);
}

function UsageRow({ 
	label, 
	current, 
	max, 
	format, 
	color 
}: { 
	label: string, 
	current: number, 
	max: number | string, 
	format: (v: any) => any, 
	color: string 
}) {
	// Check if max is exactly the string 'unlimited' (case-insensitive)
	const isUnlimited = typeof max === 'string' && max.toLowerCase() === 'unlimited';
	
	// If unlimited, percentage is 0. Otherwise, cast max to number and calculate.
	const percentage = isUnlimited 
		? 0 
		: Math.min((current / (max as number)) * 100, 100);
	
	return (
		<div>
			<div className="flex justify-between text-xs mb-2">
				<span className="text-secondary-foreground font-medium">{label}</span>
				<span className="text-white font-medium">
					{isUnlimited ? (
						<span className="text-white/20">Unlimited</span>
					) : (
						<>
							{format(current)}
							<span className="text-white/20"> / {format(max)}</span>
						</>
					)}
				</span>
			</div>
			{/* Progress Bar Track */}
			<div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
				<div 
					className={`h-full rounded-full transition-all duration-500 ${color}`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

function InvoiceRow({ date, amount, status, pdfUrl }: { date: string, amount: string, status: string, pdfUrl: string | null }) {
	return (
		<div className="flex items-center justify-between group cursor-pointer">
			<div className="flex items-center gap-3">
				<FileText size={14} className="text-secondary-foreground group-hover:text-primary transition-colors" />
				<span className="text-sm text-secondary-foreground group-hover:text-white transition-colors">{date}</span>
			</div>
			<div className="flex items-center gap-3">
				<span className="text-sm text-secondary-foreground font-medium">{amount}</span>
				{pdfUrl && (
					<a
						href={pdfUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:text-primary/80 transition-colors"
					>
						<Download size={14} />
					</a>
				)}
			</div>
		</div>
	);
}