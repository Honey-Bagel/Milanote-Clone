import { useEffect, useRef, useState } from "react";
import { Canvas, Point } from "fabric";
import CustomNoteComponent from "./FabNote";

const FabCanvas = () => {
	const canvasRef = useRef(null);
	const [canvas, setCanvas] = useState(null);
	const isPanning = useRef(false);
	const lastPosX = useRef(0);
	const lastPosY = useRef(0);

	useEffect(() => {
		const myCanvas = new Canvas(canvasRef.current, {
			width: 800,
			height: 600,
			backgroundColor: "#ffffcc",
			selection: false
		});
		setCanvas(myCanvas);

		myCanvas.on('mouse:down', (event) => {
			console.log('clicked something;')
			if(!event.target) {
				console.log('clicked canvas')
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
				myCanvas.absolutePan(new Point(deltaX, deltaY)); // Pan the canvas
				lastPosX.current = event.e.clientX;
				lastPosY.current = event.e.clientY;
				console.log('moved')
			}
		  });

		  myCanvas.on('object:modified', (event) => {
			const modifiedNote = event.target;
			if(modifiedNote && modifiedNote.type === 'customNote') {
				console.log('Text content:', modifiedNote.getText());
			}
		  })
	  
		  // Handle mouse up to stop panning
		  myCanvas.on('mouse:up', () => {
			isPanning.current = false;
			myCanvas.setCursor('default');
		  });

		myCanvas.renderAll();
		return () => {
			myCanvas.dispose();
		}
	}, []);

	return (
		<div>
			<canvas ref={canvasRef} width={800} height={600} id="canvas" />
			{canvas && <CustomNoteComponent canvas={canvas} />}
		</div>
	)
}

export default FabCanvas;