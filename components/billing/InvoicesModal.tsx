'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Invoice } from "@/lib/types/billing";

interface InvoicesModalProps {
	isOpen: boolean;
	onClose: () => void;
	invoices: Invoice[];
}

export function InvoicesModal({ isOpen, onClose, invoices }: InvoicesModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-lg bg-[#0b0e1b] border-white/10 text-white">
				<DialogHeader>
					<DialogTitle className="text-xl font-bold">Invoice History</DialogTitle>
				</DialogHeader>

				<div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
					{invoices.length > 0 ? (
						<div className="space-y-2">
							{invoices.map((invoice) => (
								<div
									key={invoice.id}
									className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
								>
									<div className="flex items-center gap-3">
										<FileText size={16} className="text-secondary-foreground" />
										<div>
											<p className="text-sm font-medium text-white">
												{format(new Date(invoice.created), 'MMM d, yyyy')}
											</p>
											<p className="text-xs text-secondary-foreground">
												{invoice.number || 'Invoice'}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-4">
										<div className="text-right">
											<p className="text-sm font-medium text-white">
												${invoice.amount.toFixed(2)}
											</p>
											<p className={`text-xs capitalize ${
												invoice.status === 'paid'
													? 'text-green-400'
													: invoice.status === 'open'
													? 'text-yellow-400'
													: 'text-secondary-foreground'
											}`}>
												{invoice.status}
											</p>
										</div>
										<div className="flex items-center gap-2">
											{invoice.pdfUrl && (
												<a
													href={invoice.pdfUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="p-2 rounded-lg hover:bg-white/10 text-secondary-foreground hover:text-white transition-colors"
													title="Download PDF"
												>
													<Download size={16} />
												</a>
											)}
											{invoice.hostedUrl && (
												<a
													href={invoice.hostedUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="p-2 rounded-lg hover:bg-white/10 text-secondary-foreground hover:text-white transition-colors"
													title="View Invoice"
												>
													<ExternalLink size={16} />
												</a>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-secondary-foreground text-center py-8">
							No invoices yet
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
