import { create, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

interface BoardState {
	// UI
	importDrawerOpen: boolean;
	presentationSidebarOpen: boolean;
	selectedPresentationNodeId: string | null;
	shareModalOpen: boolean;

	setImportDrawerOpen: (open: boolean) => void;
	setPresentationSidebarOpen: (open: boolean) => void;
	setShareModalOpen: (open: boolean) => void;
	setSelectedPresentationNodeId: (id: string | null) => void;
};

export const useBoardStore = create<BoardState>()(
	immer((set) => ({
		importDrawerOpen: false,
		presentationSidebarOpen: false,
		shareModalOpen: false,
		selectedPresentationNodeId: null,

		setImportDrawerOpen: (open) =>
			set((state) => {
				state.importDrawerOpen = open;
			}),

		setPresentationSidebarOpen: (open) =>
			set((state) => {
				state.presentationSidebarOpen = open;
			}),

		setShareModalOpen: (open) =>
			set((state) => {
				state.shareModalOpen = open;
			}),

		setSelectedPresentationNodeId: (id) =>
			set((state) => {
				state.selectedPresentationNodeId = id;
			}),
	})),
)