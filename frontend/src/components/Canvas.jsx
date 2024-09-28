import { DndContext, useDroppable } from "@dnd-kit/core";
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { useNotesContext } from '../hooks/useNotesContext';
import { useAuthContext } from "../hooks/useAuthContext";
import { ZoomTransform, zoom } from 'd3-zoom';

import Note from './Note';

const Canvas = (props) => {
	const transform = props.transform;
	const setTransform = props.setTransform;
	const { notes, dispatch } = useNotesContext();
	const { user } = useAuthContext();

	const canvasRef = useRef<HTMLDivElement | null>(null);

	const handleDragEnd = (e) => {
		const note = notes.find((n) => n._id === e.active.id);
		note.position.x += e.delta.x;
		note.position.y += e.delta.y;
		const _notes = notes.map((n) => {
			if(n._id === note._id) return note;
			return n;
		});
		dispatch({ type: 'SET_NOTES', payload: _notes });
	}

	useEffect(() => {
		
		const fetchNotes = async () => {
			const response = await fetch('/api/notes');

			const json = await response.json();
			console.log(json);

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
	})

	return (
		<div className="canvasWindow">
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
            <Note note={note} key={note._id} 
			styles={{
				position: "absolute",
				left: `${note.position.x}px`,
				top: `${note.position.y}px`
			}} />
          ))}
        </DndContext>
      </div>
    </div>
	);
}

export default Canvas;