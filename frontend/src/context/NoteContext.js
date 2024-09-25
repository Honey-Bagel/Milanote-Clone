import { createContext, useReducer } from 'react';

export const NotesContext = createContext();

export const notesReducer = (state, action) => {
	switch (action.type) {
		case 'SET_NOTES':
			return {
				notes: action.payload
			}
		case 'CREATE_NOTE':
			return {
				notes: [action.payload, ...state.notes]
			}
		case 'DELETE_NOTE':
			return {
				notes: state.notes.filter((n) => n._id !== action.payload._id)
			}
		default:
			return state
	}
};

export const NotesContextProvider = ({ children }) => {
	const [state, dispatch] = useReducer(notesReducer, {
		notes: null
	});

	return (
		<NotesContext.Provider value={{...state, dispatch}}>
			{ children }
		</NotesContext.Provider>
	)
}