import { create, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

interface BoardState {
	// UI
	importDrawerOpen: boolean;

	setImportDrawerOpen: (open: boolean) => void;
};

export const useBoardStore = create<BoardState>()(
	immer((set) => ({
		importDrawerOpen: false,

		setImportDrawerOpen: (open) =>
			set((state) => {
				state.importDrawerOpen = open;
			}),
	})),
)