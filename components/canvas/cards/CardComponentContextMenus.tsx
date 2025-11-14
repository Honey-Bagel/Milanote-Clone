'use client';

import { Card } from "@/lib/types";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

function LinkCardContextMenu(card: Card, onClose: () => void) {
	const full_url = card.link_cards.url.startsWith("https://") || card.link_cards.url.startsWith("http://") ?
				card.link_cards.url :
				"https://" + card.link_cards.url

	const handleClose = () => {
		onClose?.();
		console.log("on close");
	}

	return (
		<>
			<a onClick={handleClose} target="_blank" rel="noopener noreferrer" href={full_url} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
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