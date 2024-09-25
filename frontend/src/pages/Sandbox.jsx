import React, { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { ZoomTransform, zoomIdentity } from 'd3-zoom';

import Note from '../components/Note';
//components
import Canvas from '../components/Canvas';

const Sandbox = () => {
	const [parent, setParent] = useState(null);
	const [transform, setTransform] = useState(zoomIdentity);
	const [activeId, setActiveId] = useState(null);

	const draggableMarkup = (
		<Note id="draggable">Drag me</Note>
	);

	function handleDragEnd(event) {
		console.log('dragend')
	}


	return (
		<DndContext 
		onDragEnd={handleDragEnd}
		>
		
		<Canvas transform={transform} setTransform={setTransform}/>
	

		
		</DndContext>
	);
}

export default Sandbox;