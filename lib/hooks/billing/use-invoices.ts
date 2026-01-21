import useSWR from "swr";
import { Invoice } from "@/lib/types/billing";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useInvoices() {
	const { data, error } = useSWR<{ invoices: Invoice[] }>(
		'/api/billing/invoices',
		fetcher
	);

	return {
		invoices: data?.invoices || [],
		isLoading: !error && !data,
		error,
	};
}