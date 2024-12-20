import React, { useRef } from 'react';
import useCanvas from '../hooks/useCanvas';
import { BoardsContextProvider } from '../context/BoardContext';

import ToolBar from './ToolBar';
import BoardNavBar from './BoardNavBar';

const Board = (board) => {
	const canvasRef = useRef(null);
	const { canvas, addNote, addBoard } = useCanvas(canvasRef, board);

	const tbAddNote = () => {
		addNote(0, 0);
	}

	const tbAddBoard = () => {
		addBoard(0, 0);
	}
	
	return (
		<div>
			<BoardNavBar />
			<ToolBar addNote={tbAddNote} addBoard={tbAddBoard}></ToolBar>
			<div>
				<div id="canvas-container">
				<canvas ref={canvasRef}/>
			</div>
			</div>
			
		</div>
	)

}

export default Board;