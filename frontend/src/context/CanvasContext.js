import React, { createContext, useState, useContext } from 'react';

const CanvasContext = createContext();

export const useCanvasContext = () => {
	return useContext(CanvasContext);
};

export const CanvasProvider = ({ childern}) => {
	const [activeNote, setActiveNote] = useState(null);

	return (
		<CanvasContext.Provider value={{ activeNote, setActiveNote }}>
			{children}
		</CanvasContext.Provider>
	);
};