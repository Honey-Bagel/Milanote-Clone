import React, { useRef } from 'react';
import { BoardsContextProvider } from '../context/BoardContext';

// Contexts
import { useAuthContext } from '../hooks/useAuthContext';
import { useNotesContext } from '../hooks/useNotesContext';

// Components
import ToolBar from './ToolBar';
import BoardNavBar from './BoardNavBar';

const Board = (board) => {
	const canvasRef = useRef(null);
    const { user } = useAuthContext();
    const { dispatch } = useNotesContext();
    
	//const { canvas, addNote, addBoard } = useCanvas(canvasRef, board, user, dispatch);

	const tbAddNote = () => {
		//addNote(0, 0);
	}

	const tbAddBoard = () => {
		//addBoard(0, 0);
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