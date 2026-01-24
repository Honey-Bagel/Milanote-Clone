'use client';

import { ArrowUpDown, Calendar, Type, LayoutGrid, List } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import type { SortField, SortDirection, ItemsPerRow } from '@/lib/hooks/use-drawer-persistence';

interface DrawerSortDropdownProps {
	sortField: SortField;
	sortDirection: SortDirection;
	itemsPerRow: ItemsPerRow;
	onSortFieldChange: (field: SortField) => void;
	onSortDirectionChange: (direction: SortDirection) => void;
	onItemsPerRowChange: (itemsPerRow: ItemsPerRow) => void;
}

export function DrawerSortDropdown({
	sortField,
	sortDirection,
	itemsPerRow,
	onSortFieldChange,
	onSortDirectionChange,
	onItemsPerRowChange,
}: DrawerSortDropdownProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					className="p-2 rounded-lg transition-colors hover:bg-white/5 text-secondary-foreground hover:text-white"
					aria-label="Sort and display options"
				>
					<ArrowUpDown size={16} />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-56 bg-[#0f172a] border-white/10 text-foreground"
			>
				<DropdownMenuLabel className="text-secondary-foreground">Sort By</DropdownMenuLabel>
				<DropdownMenuSeparator className="bg-white/10" />

				<DropdownMenuRadioGroup
					value={sortField}
					onValueChange={(value) => onSortFieldChange(value as SortField)}
				>
					<DropdownMenuRadioItem
						value="date"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						<Calendar size={14} className="mr-2" />
						Date Modified
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem
						value="name"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						<Type size={14} className="mr-2" />
						Name
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>

				<DropdownMenuSeparator className="bg-white/10" />
				<DropdownMenuLabel className="text-secondary-foreground">Order</DropdownMenuLabel>

				<DropdownMenuRadioGroup
					value={sortDirection}
					onValueChange={(value) => onSortDirectionChange(value as SortDirection)}
				>
					<DropdownMenuRadioItem
						value="asc"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						{sortField === 'name' ? 'A → Z' : 'Oldest First'}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem
						value="desc"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						{sortField === 'name' ? 'Z → A' : 'Newest First'}
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>

				<DropdownMenuSeparator className="bg-white/10" />
				<DropdownMenuLabel className="text-secondary-foreground">Items Per Row</DropdownMenuLabel>

				<DropdownMenuRadioGroup
					value={String(itemsPerRow)}
					onValueChange={(value) => onItemsPerRowChange(Number(value) as ItemsPerRow)}
				>
					<DropdownMenuRadioItem
						value="1"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						<List size={14} className="mr-2" />
						1 per row
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem
						value="2"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						<LayoutGrid size={14} className="mr-2" />
						2 per row
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
