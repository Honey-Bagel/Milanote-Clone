import { createContext, useReducer } from 'react';

export const BoardsContext = createContext();

export const boardsReducer = (state, action) => {
	switch (action.type) {
		case 'SET_BOARD':
			return {
				board: action.payload
			}
		case 'REMOVE_BOARD':
			return {
				board: null
			}
		default:
			return state;
	}
};

export const BoardsContextProvider = ({ children }) => {
	const [state, dispatch] = useReducer(boardsReducer, {
		board: null
	});

	return (
		<BoardsContext.Provider value ={{...state, dispatch}}>
			{ children }
		</BoardsContext.Provider>
	)
}