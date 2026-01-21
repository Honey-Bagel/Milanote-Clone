'use client';

import { Card, CardData } from "@/lib/types";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

function LinkCardContextMenu(card: CardData, onClose: () => void) {
	if (card.card_type !== 'link') return <></>;
	const full_url = card.link_url.startsWith("https://") || card.link_url.startsWith("http://") ?
				card.link_url :
				"https://" + card.link_url

	const handleClose = () => {
		onClose?.();
		console.log("on close");
	}

	return (
		<>
			<a onClick={handleClose} target="_blank" rel="noopener noreferrer" href={full_url} className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
				<ExternalLink className="w-4 h-4" />
				<span>Open Link</span>
			</a>
		</>
	)
};

export function GetCardTypeContextMenu(card: Card, onClose: () => void) {
	switch (card.card_type) {
		case "link":
			return LinkCardContextMenu(card, onClose);
		default:
			return null;
	}
}