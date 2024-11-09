import React, { useRef } from 'react';
import useCanvas from '../hooks/useCanvas';

import ToolBar from './ToolBar';

const Board = () => {
	const canvasRef = useRef(null);
	const { canvas, addNote } = useCanvas(canvasRef);

	const tbAddNote = () => {
		addNote(0, 0);
	}

	return (
		<div>
			<ToolBar addNote={tbAddNote}></ToolBar>
			<div>
				<div className="canvas-container">
				<canvas ref={canvasRef}/>
			</div>
			</div>
			
		</div>
	)

}

export default Board;