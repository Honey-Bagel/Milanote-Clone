import { Canvas, Point, Textbox } from "fabric";
import { useEffect, useState, useRef } from 'react';
import {CustomNoteComponent, CustomNote} from "./FabNote";
import ToolBar from "./ToolBar";

const Board = () => {
	const canvasRef = useRef(null);
	const [canvas, setCanvas] = useState(null);
	const isPanning = useRef(false);
	const lastPosX = useRef(0);
	const lastPosY = useRef(0);
	const gridSize = 50;
  	const gridLines = useRef([]);
	const [notes, setNotes] = useState([]);

	useEffect(() => {
		const myCanvas = new Canvas(canvasRef.current, {
			width: 1300,
			height: 1100,
			backgroundColor: '#ffffc4',
			selection: false,
		});

		myCanvas.on('mouse:down', (event) => {
			if(!event.target) {
				isPanning.current = true;
				lastPosX.current = event.e.clientX;
				lastPosY.current = event.e.clientY;
				myCanvas.setCursor('grab'); // Change cursor for panning
			}
		  });

		myCanvas.on('mouse:move', (event) => {
			if (isPanning.current) {
				const deltaX = event.e.clientX - lastPosX.current;
				const deltaY = event.e.clientY - lastPosY.current;
				myCanvas.relativePan(new Point(deltaX, deltaY)); // Pan the canvas
				lastPosX.current = event.e.clientX;
				lastPosY.current = event.e.clientY;
				myCanvas.setCursor('grab');
			}
		  });
	  
		  // Handle mouse up to stop panning
		  myCanvas.on('mouse:up', () => {
			isPanning.current = false;
			myCanvas.setCursor('default');
		  });

		setCanvas(myCanvas);

		myCanvas.renderAll();
		
		return () => {
			myCanvas.dispose();
		}
	}, []);


	const addNoteObject = () => {
		if(canvas) {
			const note = new CustomNote({
				left: 100,
				top: 100,
				noteText: 'Click to edit',
				fill: 'lightblue',
				textColor: 'darkblue',
			  }, canvas);

			canvas.add(note.getGroup());
			canvas.renderAll();
		}
	}

	return (
		<div>
			<ToolBar addNote={addNoteObject} ></ToolBar>
			<canvas ref={canvasRef} id="canvas" style={{ border: '1px solid #cc' }}/>
		</div>
	)
}

export default Board;