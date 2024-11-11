import React, { useRef } from 'react';
import useCanvas from '../hooks/useCanvas';
import { BoardsContextProvider } from '../context/BoardContext';

import ToolBar from './ToolBar';
import BoardNavBar from './BoardNavBar';

const Board = (board) => {
	const canvasRef = useRef(null);
	const { canvas, addNote } = useCanvas(canvasRef, board);

	const tbAddNote = () => {
		addNote(0, 0);
	}
	
	return (
		<BoardsContextProvider>
			<div>
			<BoardNavBar />
			<ToolBar addNote={tbAddNote}></ToolBar>
			<div>
				<div id="canvas-container">
				<canvas ref={canvasRef}/>
			</div>
			</div>
			
		</div>
		</BoardsContextProvider>
		
	)

}

export default Board;