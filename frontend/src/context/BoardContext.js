import { createContext, useReducer } from 'react';

export const BoardsContext = createContext();

export const boardsReducer = (state, action) => {
	switch (action.type) {
		case 'SET_BOARDS':
			return {
				boards: action.payload
			}
		case 'CREATE_BOARD':
			return {
				boards: [action.payload, ...state.boards]
			}
		case 'DELETE_BOARD':
			return {
				boards: state.boards.filter((b) => b._id !== action.payload._id)
			}
		default:
			return state
	}
};

export const BoardsContextProvider = ({ children }) => {
	const [state, dispatch] = useReducer(boardsReducer, {
		boards: null
	});

	return (
		<BoardsContext.Provider value ={{...state, dispatch}}>
			{ children }
		</BoardsContext.Provider>
	)
}