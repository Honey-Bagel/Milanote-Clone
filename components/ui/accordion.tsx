'use client';

import * as React from 'react';
import * as AccordionPrimative from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Accordion = AccordionPrimative.Root;

const AccordionItem = React.forwardRef<
	React.ElementRef<typeof AccordionPrimative.Item>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimative.Item>
>(({ className, ...props }, ref) => (
	<AccordionPrimative.Item
		ref={ref}
		className={cn('border-b border-white/10', className)}
		{...props}
	/>
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
	React.ElementRef<typeof AccordionPrimative.Trigger>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimative.Trigger>
>(({ className, children, ...props }, ref) => (
	<AccordionPrimative.Header className="flex">
		<AccordionPrimative.Trigger
			ref={ref}
			className={cn(
				'flex flex-1 items-center justify-between py-5 txt-left text-base font-medium text-white transition-all hover:text-indigo-400',
				'[&[data-state=open]>svg]:rotate-180',
				className
			)}
			{...props}
		>
			{children}
			<ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300" />
		</AccordionPrimative.Trigger>
	</AccordionPrimative.Header>
));
AccordionTrigger.displayName = AccordionPrimative.Trigger.displayName;

const AccordionContent = React.forwardRef<
	React.ElementRef<typeof AccordionPrimative.Content>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimative.Content>
>(({ className, children, ...props }, ref) => (
	<AccordionPrimative.Content
		ref={ref}
		className="overflow-hidden text-sm text-slate-400 transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
		{...props}
	>
		<div className={cn('pb-5 pt-0 leading-relaxed', className)}>{children}</div>
	</AccordionPrimative.Content>
));
AccordionContent.displayName = AccordionPrimative.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };