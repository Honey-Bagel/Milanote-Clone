'use client';

interface ToggleCardProps {
	title: string;
	description: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

export function ToggleCard({ title, description, checked, onChange }: ToggleCardProps) {
	return (
		<label className="flex items-center justify-between p-4 bg-[#020617] border border-white/10 rounded-xl hover:border-white/20 cursor-pointer transition-all group">
			<div className="flex-1">
				<div className="font-medium text-sm text-white group-hover:text-indigo-400 transition-colors">{title}</div>
				<div className="text-xs text-slate-400 mt-1">{description}</div>
			</div>
			<div className="relative">
				<input
					type="checkbox"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					className="sr-only"
				/>
				<div className={`w-11 h-6 rounded-full transition-all ${
					checked ? 'bg-indigo-600' : 'bg-slate-700'
				}`}>
					<div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-200 ease-in-out transform ${
						checked ? 'translate-x-6' : 'translate-x-0.5'
					} translate-y-0.5`}></div>
				</div>
			</div>
		</label>
	);
}
