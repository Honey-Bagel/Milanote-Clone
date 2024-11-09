import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { ZoomTransform, zoomIdentity } from 'd3-zoom';
import { useParams } from 'react-router-dom';

import Note from '../components/Note';
//components
import Canvas from '../components/Canvas';
import { useAuthContext } from '../hooks/useAuthContext';

const Sandbox = () => {
	const boardId = useParams().id
	const { user } = useAuthContext();

	// States
	const [parent, setParent] = useState(null);
	const [transform, setTransform] = useState(zoomIdentity);
	const [activeId, setActiveId] = useState(null);
	const [board, setBoard] = useState(null);
	const [error, setError] = useState(null);

	const calculateCanvasPos = (
		initialRect,
		over,
		delta,
		transform
	) => ( {
		x: (initialRect.left + delta.x - (over?.rect?.left ?? 0) - transform.x) / transform.k,
		y: (initialRect.top + delta.y - (over?.rect?.top ?? 0) - transform.y) / transform.k,
	});

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
		<Canvas transform={transform} setTransform={setTransform} boardId={boardId}/>
		{error && <div className="error">{error}</div>}
	

		
		</DndContext>
	);
}

export default Sandbox;