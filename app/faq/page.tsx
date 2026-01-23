'use client';

import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion';

interface FAQItem {
	question: string;
	answer: string;
}

interface FAQSection {
	category: string;
	items: FAQItem[];
}

const FAQ_ITEMS: FAQSection[] = [
	{
		category: 'Getting Started',
		items: [
			{
				question: 'What is Notera?',
				answer:
					'Notera is a visual workspace that lets you organize ideas, images, tasks, and notes on an infinite spatial canvas. Unlike traditional linear documents, Notera helps you see connections between ideas and work the way your mind naturally thinks.',
			},
			{
				question: 'How do I create my first board?',
				answer:
					'After signing up, click the "New Board" button in your dashboard. You can start with a blank canvas or choose from our templates. Drag and drop to add notes, images, tasks, and more.',
			},
			{
				question: 'Is there a free tier?',
				answer:
					'Yes! Our free plan includes up to 10 boards, 250 cards, and 250MB of storage. It\'s perfect for personal projects and trying out Notera.',
			},
		],
	},
	{
		category: 'Features',
		items: [
			{
				question: 'What card types are available?',
				answer:
					'Notera supports multiple card types: Notes (rich text with formatting), Images (drag & drop from your computer), Tasks (checklists with progress tracking), Code snippets (with syntax highlighting), Links (with automatic previews), and Files (document attachments).',
			},
			{
				question: 'Can I collaborate with others?',
				answer:
					'Yes! With our Standard and Pro plans, you can invite team members to your boards. Everyone can see real-time cursors and changes as they happen.',
			},
			{
				question: 'Does Notera work offline?',
				answer:
					'Currently, Notera requires an internet connection. We\'re working on offline support and it\'s planned for a future release.',
			},
		],
	},
	{
		category: 'Pricing & Billing',
		items: [
			{
				question: "What's included in the free plan?",
				answer:
					'The free plan includes 10 boards, 250 cards per board, 250MB storage, and access to all basic card types. You can use Notera indefinitely on the free plan.',
			},
			{
				question: 'How do I upgrade my plan?',
				answer:
					'Go to your dashboard settings and click on "Billing". Choose your preferred plan (Standard or Pro) and complete the checkout. Your new limits will apply immediately.',
			},
			{
				question: 'Can I cancel anytime?',
				answer:
					'Absolutely. You can cancel your subscription at any time from your billing settings. You\'ll continue to have access to paid features until the end of your current billing period.',
			},
		],
	},
	{
		category: 'Security',
		items: [
			{
				question: 'Is my data secure?',
				answer:
					'Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use industry-standard security practices and regularly audit our systems.',
			},
			{
				question: 'Where is my data stored?',
				answer:
					'Your data is stored in secure cloud infrastructure in the United States. We use redundant storage to ensure your data is always available and backed up.',
			},
		],
	},
];

export default function FAQPage() {
	return (
		<div className="min-h-screen bg-[#020617] text-slate-300">
			<LandingNavbar />

			<main className="pt-32 pb-20 px-4">
				<div className="max-w-3xl mx-auto">
					{/* Header */}
					<div className="text-center mb-16">
						<h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
							Frequently Asked Questions
						</h1>
						<p className="text-slate-400 text-lg">
							Everything you need to know about Notera.
						</p>
					</div>

					{/* FAQ Sections */}
					<div className="space-y-12">
						{FAQ_ITEMS.map((section) => (
							<div key={section.category}>
								<h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6">
									{section.category}
								</h2>
								<Accordion type="single" collapsible className="space-y-2">
									{section.items.map((item, index) => (
										<AccordionItem
											key={index}
											value={`${section.category}-${index}`}
											className="bg-[#0f172a]/50 rounded-xl border border-white/5 px-6"
										>
											<AccordionTrigger>{item.question}</AccordionTrigger>
											<AccordionContent>{item.answer}</AccordionContent>
										</AccordionItem>
									))}
								</Accordion>
							</div>
						))}
					</div>

					{/* Contact CTA */}
					<div className="mt-16 text-center p-8 rounded-2xl bg-[#0f172a]/50 border border-white/5">
						<h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
						<p className="text-slate-400 mb-4">
							We're here to help. Reach out to our support team.
						</p>
						<a
							href="mailto:support@notera.app"
							className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
						>
							Contact Support
						</a>
					</div>
				</div>
			</main>

			<LandingFooter />
		</div>
	);
}
