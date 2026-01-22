import useSWR from "swr";
import { Invoice } from "@/lib/types/billing";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useInvoices() {
	const { data, error } = useSWR<{ invoices: Invoice[] }>(
		'/api/billing/invoices',
		fetcher,
		{
			dedupingInterval: 5000,
			revalidateOnFocus: false,
		}
	);

	return {
		invoices: data?.invoices || [],
		isLoading: !error && !data,
		error,
	};
}