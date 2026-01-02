'use client'

import { LucideIcon } from "lucide-react";

interface QuickActionProps {
	icon: LucideIcon;
	title: string;
	subtitle: string;
	color: "indigo" | "cyan" | "purple" | "emerald";
	onClick?: () => void;
}

export function QuickActionCard({ icon: Icon, title, subtitle, color, onClick }: QuickActionProps) {
	const colors = {
		indigo: 'from-primary/20 to-primary/20 border-primary/30 text-primary hover:border-indigo-400/50',
		cyan: 'from-cyan-500/20 to-cyan-600/20 border-accent/30 text-accent hover:border-cyan-400/50',
		purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400 hover:border-purple-400/50',
		emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400 hover:border-emerald-400/50'
	};

	return (
		<button
			onClick={onClick}
			className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-6 hover:scale-[1.02] transition-all duration-200 text-left group shadow-lg hover:shadow-xl`}
		>
			<div className={`p-2.5 rounded-xl bg-white/5 w-fit mb-4 group-hover:bg-white/10 transition-colors backdrop-blur-sm`}>
				<Icon size={24}/>
			</div>
			<div className="text-white font-bold text-lg mb-1">{title}</div>
			<div className="text-xs text-secondary-foreground/80 font-medium">{subtitle}</div>
		</button>
	)
}
