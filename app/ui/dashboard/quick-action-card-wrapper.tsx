'use client'

import { Layout, Palette, Code, Plus, LucideIcon } from "lucide-react";
import { QuickActionCard } from "./quick-action-card";

interface QuickActionCardWrapperProps {
	iconName: "Layout" | "Palette" | "Code" | "Plus";
	title: string;
	subtitle: string;
	color: "indigo" | "cyan" | "purple" | "emerald";
	onClick?: () => void;
}

const iconMap: Record<string, LucideIcon> = {
	Layout,
	Palette,
	Code,
	Plus
};

export function QuickActionCardWrapper({ iconName, title, subtitle, color, onClick }: QuickActionCardWrapperProps) {
	const Icon = iconMap[iconName];

	return (
		<QuickActionCard
			icon={Icon}
			title={title}
			subtitle={subtitle}
			color={color}
			onClick={onClick}
		/>
	);
}
