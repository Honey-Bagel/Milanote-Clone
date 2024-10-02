import { DndContext, useDroppable } from "@dnd-kit/core";
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { useNotesContext } from '../hooks/useNotesContext';
import { useAuthContext } from "../hooks/useAuthContext";
import { ZoomTransform, zoom } from 'd3-zoom';
import { select } from 'd3-selection';

import Note from './Note';

const Canvas = (props) => {
	const transform = props.transform;
	const setTransform = props.setTransform;
	const { notes, dispatch } = useNotesContext();
	const { user } = useAuthContext();

	const { setNodeRef } = useDroppable({
		id: "canvas",
	});

	const canvasRef = useRef(null);

	const updateAndForwardRef = (div) => {
		canvasRef.current = div;
		setNodeRef(div);
	}

	const zoomBehavior = useMemo(() => zoom(), []);

	const updateTransform = useCallback(({ transform}) => {
		setTransform(transform);
	}, [setTransform]);

	const saveData = async (id, payload) => {
		console.log(id)
		const response = await fetch('/api/notes/' + id, {
			method: 'PATCH',
			body: JSON.stringify(payload),
			headers: {
				'Content-Type': 'application/json'
			}
		})
		const json = await response.json();

		if(!response.ok) {
			console.log('patch failed');
		}
		// if(response.ok) {
		// 	dispatch({type: 'SET_NOTES', })
		// }
	}

	const handleDragEnd = (e) => {
		const note = notes.find((n) => n._id === e.active.id);
		note.position.x += e.delta.x;
		note.position.y += e.delta.y;
		const _notes = notes.map((n) => {
			if(n._id === note._id) return note;
			return n;
		});
		dispatch({ type: 'SET_NOTES', payload: _notes });
		saveData(note._id, note);
	}

	useEffect(() => {
		
		const fetchNotes = async () => {
			const response = await fetch('/api/notes');

			const json = await response.json();

			if(response.ok) {
				dispatch({type: 'SET_NOTES', payload: json});
			}
		}

		if(user) {
			fetchNotes();
		}
	}, [dispatch, user]);


	useLayoutEffect(() => {
		if(!canvasRef.current) return;

		zoomBehavior.on("zoom", updateTransform);

		select(canvasRef.current).call(zoomBehavior);
	}, [zoomBehavior, canvasRef, updateTransform]);

	return (
		<div className="canvasWindow" ref={updateAndForwardRef}>
      <div
        className="canvas"
        style={{
          // apply the transform from d3
          transformOrigin: "top left",
          transform: `translate3d(${transform.x}px, ${transform.y}px, ${transform.k}px)`,
          position: "relative",
          height: "300px",
        }}
      >
        <DndContext onDragEnd={handleDragEnd}>
          {notes && notes.map((note) => (
            <Note note={note} key={note._id} canvasTransform={transform}
			styles={{
				position: "absolute",
				left: `${note.position.x * transform.k}px`,
				top: `${note.position.y * transform.k}px`
			}} />
          ))}
        </DndContext>
      </div>
    </div>
	);
}

export default Canvas;