export interface PaymentMethod {
	id: string;
	brand: string;
	last4: string;
	expMonth: number;
	expYear: number;
	isDefault: boolean;
};

export interface Invoice {
	id: string;
	number: string | null;
	amount: number;
	currency: string;
	status: string;
	created: number;
	pdfUrl: string | null;
	hostedUrl: string | null;
	periodStart: number;
	periodEnd: number;
}

export interface SetupIntentResponse {
	clientSecret: string;
}

export interface PaymentMethodUpdateRequest {
	paymentMethodId: string;
}