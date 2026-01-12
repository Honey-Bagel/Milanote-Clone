'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, Star, StarOff, Home } from 'lucide-react';
import { useTemplates } from '@/lib/hooks/templates/use-templates';
import { useIsAdmin } from '@/lib/hooks/use-is-admin';
import { TemplateService } from '@/lib/services/template-service';
import Link from 'next/link';

export default function AdminTemplatesPage() {
	const router = useRouter();
	const { isLoading: isAdminLoading, isAdmin } = useIsAdmin();
	const { templates, isLoading } = useTemplates();
	const [deletingId, setDeletingId] = useState<string | null>(null);

	// Redirect non-admins (use useEffect to avoid setState during render)
	useEffect(() => {
		if ((!isLoading && !isAdminLoading) && !isAdmin) {
			router.push('/dashboard');
		}
	}, [isLoading, isAdminLoading, isAdmin, router]);

	const handleDelete = async (templateId: string) => {
		if (!confirm('Are you sure you want to delete this template?')) return;

		setDeletingId(templateId);
		try {
			await TemplateService.deleteTemplate(templateId);
		} catch (error) {
			console.error('Failed to delete template:', error);
			alert('Failed to delete template');
		} finally {
			setDeletingId(null);
		}
	};

	const handleToggleFeatured = async (templateId: string, currentlyFeatured: boolean) => {
		try {
			await TemplateService.updateTemplate(templateId, {
				is_featured: !currentlyFeatured,
			});
		} catch (error) {
			console.error('Failed to toggle featured status:', error);
			alert('Failed to update template');
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#020617] flex items-center justify-center">
				<div className="text-white">Loading...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#020617] text-white">
			{/* Header */}
			<div className="border-b border-white/10 bg-[#0f172a]">
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Template Management</h1>
						<p className="text-sm text-neutral-400 mt-1">
							Manage board templates for all users
						</p>
					</div>
					<Link
						href="/dashboard"
						className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
					>
						<Home size={16} />
						Back to Dashboard
					</Link>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-7xl mx-auto px-6 py-8">
				{templates.length === 0 ? (
					<div className="text-center py-24">
						<p className="text-neutral-400">No templates created yet</p>
						<p className="text-sm text-neutral-500 mt-2">
							Use the &quot;Export as Template&quot; button on any board to create a template
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{templates.map((template) => (
							<div
								key={template.id}
								className="bg-[#0f172a] border border-white/10 rounded-lg p-6 flex items-center justify-between"
							>
								{/* Template Info */}
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h3 className="text-lg font-semibold">{template.name}</h3>
										{template.is_featured && (
											<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
										)}
										<span className="text-xs bg-neutral-700 px-2 py-1 rounded">
											{template.category}
										</span>
									</div>
									{template.description && (
										<p className="text-sm text-neutral-400 mb-3">
											{template.description}
										</p>
									)}
									<div className="flex items-center gap-4 text-xs text-neutral-500">
										<span>Used {template.usage_count || 0} times</span>
										<span>
											Created{' '}
											{new Date(template.created_at).toLocaleDateString()}
										</span>
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center gap-2">
									<button
										onClick={() =>
											handleToggleFeatured(template.id, template.is_featured || false)
										}
										className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
										title={
											template.is_featured
												? 'Remove from featured'
												: 'Mark as featured'
										}
									>
										{template.is_featured ? (
											<StarOff size={18} className="text-yellow-400" />
										) : (
											<Star size={18} className="text-neutral-400" />
										)}
									</button>
									<button
										onClick={() => handleDelete(template.id)}
										disabled={deletingId === template.id}
										className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors disabled:opacity-50"
										title="Delete template"
									>
										<Trash2 size={18} />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
