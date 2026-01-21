'use client';

import { Filter, Calendar, Clock } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { DateFilterType } from '@/lib/utils';

export type DateFilterField = 'created_at' | 'updated_at';

interface DateFilterDropdownProps {
	filterType: DateFilterType;
	filterField: DateFilterField;
	onFilterChange: (type: DateFilterType, field: DateFilterField) => void;
}

export function DateFilterDropdown({ filterType, filterField, onFilterChange }: DateFilterDropdownProps) {
	const isActive = filterType !== 'all';

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					className={`p-2 rounded-lg transition-colors ${
						isActive
							? 'bg-primary/20 text-primary'
							: 'hover:bg-white/5 text-secondary-foreground'
					}`}
				>
					<Filter size={16} />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-56 bg-[#0f172a] border-white/10 text-foreground"
			>
				<DropdownMenuLabel className="text-secondary-foreground">Filter by Date</DropdownMenuLabel>
				<DropdownMenuSeparator className="bg-white/10" />

				<DropdownMenuRadioGroup
					value={filterType}
					onValueChange={(value) => onFilterChange(value as DateFilterType, filterField)}
				>
					<DropdownMenuRadioItem
						value="all"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						All Time
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem
						value="today"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						Today
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem
						value="week"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						Last 7 Days
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem
						value="month"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						Last 30 Days
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem
						value="year"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						Last Year
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>

				<DropdownMenuSeparator className="bg-white/10" />
				<DropdownMenuLabel className="text-secondary-foreground">Filter Field</DropdownMenuLabel>

				<DropdownMenuRadioGroup
					value={filterField}
					onValueChange={(value) => onFilterChange(filterType, value as DateFilterField)}
				>
					<DropdownMenuRadioItem
						value="updated_at"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						<Clock size={14} className="mr-2" />
						Last Updated
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem
						value="created_at"
						className="focus:bg-white/5 focus:text-white cursor-pointer"
					>
						<Calendar size={14} className="mr-2" />
						Date Created
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
