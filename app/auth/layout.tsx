// app/auth/layout.tsx
import { Layers, Palette, Users, Cloud } from "lucide-react";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="h-screen flex bg-[#020617] overflow-hidden">
			{/* Left Side */}
			<div className="flex-1 flex items-center justify-center p-6 bg-[#020617]">
				<div className="w-full max-w-md">
					{/* Logo */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl mb-4 shadow-lg shadow-primary/20">
							<Layers size={24} className="text-white" />
						</div>
						<h1 className="text-3xl font-bold text-white">CanvasOne</h1>
						<p className="text-secondary-foreground mt-2 text-sm">
							Your visual workspace
						</p>
					</div>

					{/* Page-specific content */}
					{children}
				</div>
			</div>

			{/* Right Side – Marketing Panel */}
			<div className="hidden lg:flex flex-1 bg-[#0f172a] p-12 items-center justify-center relative overflow-hidden">
				<div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
				<div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl" />

				<div
					className="absolute inset-0 opacity-[0.02]"
					style={{
						backgroundImage: `
							linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
							linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
						`,
						backgroundSize: "50px 50px",
					}}
				/>

				<div className="relative z-10 text-white max-w-lg">
					<h2 className="text-5xl font-bold mb-6 leading-tight">
						Organize your creative projects visually
					</h2>
					<p className="text-xl text-secondary-foreground mb-12">
						CanvasOne helps you organize ideas into beautiful visual boards.
					</p>

					<div className="space-y-6">
						<Feature
							icon={<Palette className="text-primary" />}
							title="Visual Workspace"
							description="Create beautiful boards with notes, images, and tasks."
						/>
						<Feature
							icon={<Users className="text-accent" />}
							title="Collaborate in Real-time"
							description="Work together and share feedback instantly."
						/>
						<Feature
							icon={<Cloud className="text-purple-400" />}
							title="Cloud Sync"
							description="Access your boards anywhere, always in sync."
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function Feature({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex items-start gap-4">
			<div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
				{icon}
			</div>
			<div>
				<h3 className="font-bold text-lg">{title}</h3>
				<p className="text-secondary-foreground text-sm">{description}</p>
			</div>
		</div>
	);
}
