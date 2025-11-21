import useSWR from "swr";
import { BreadcrumbItem } from "@/lib/data/board-breadcrumbs";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useBreadcrumbs(
	boardId: string,
	fallbackData?: BreadcrumbItem[]
) {
	const { data, error, isLoading, mutate } = useSWR<BreadcrumbItem[]>(
		`/api/boards/${boardId}/breadcrumbs`,
		fetcher,
		{
			fallbackData,
			revalidateOnFocus: false,
			dedupingInterval: 30000, // 30 seconds
		}
	);

	return {
		breadcrumbs: data ?? [],
		isLoading,
		isError: !!error,
		mutate,
	};
}
