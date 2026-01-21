import useSWR from 'swr';
import { PaymentMethod } from '@/lib/types/billing';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePaymentMethod() {
	const { data, error, mutate } = useSWR<{ paymentMethod: PaymentMethod | null}>(
		'/api/billing/payment-method',
		fetcher
	);

	return {
		paymentMethod: data?.paymentMethod,
		isLoading: !error && !data,
		error,
		refresh: mutate,
	};
}