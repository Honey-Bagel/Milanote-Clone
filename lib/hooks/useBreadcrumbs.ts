import useSWR from "swr";
import { BreadcrumbItem } from "@/lib/data/board-breadcrumbs";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useBreadcrumbs(
	boardId: string,
	fallbackData?: BreadcrumbItem[],
	isPublicView?: boolean
) {
	// In public view, don't fetch from API - just use fallback data with share tokens
	const { data, error, isLoading, mutate } = useSWR<BreadcrumbItem[]>(
		isPublicView ? null : `/api/boards/${boardId}/breadcrumbs`,
		fetcher,
		{
			fallbackData,
			revalidateOnFocus: false,
			dedupingInterval: 30000, // 30 seconds
		}
	);

	return {
		breadcrumbs: data ?? fallbackData ?? [],
		isLoading,
		isError: !!error,
		mutate,
	};
}
