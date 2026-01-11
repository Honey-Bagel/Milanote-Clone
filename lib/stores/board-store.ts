import { create, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

interface BoardState {
	// UI
	importDrawerOpen: boolean;
	presentationSidebarOpen: boolean;
	selectedPresentationNodeId: string | null;

	setImportDrawerOpen: (open: boolean) => void;
	setPresentationSidebarOpen: (open: boolean) => void;
	setSelectedPresentationNodeId: (id: string | null) => void;
};

export const useBoardStore = create<BoardState>()(
	immer((set) => ({
		importDrawerOpen: false,
		presentationSidebarOpen: false,
		selectedPresentationNodeId: null,

		setImportDrawerOpen: (open) =>
			set((state) => {
				state.importDrawerOpen = open;
			}),

		setPresentationSidebarOpen: (open) =>
			set((state) => {
				state.presentationSidebarOpen = open;
			}),

		setSelectedPresentationNodeId: (id) =>
			set((state) => {
				state.selectedPresentationNodeId = id;
			}),
	})),
)