import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ZoomTransform } from "d3-zoom";

const Note = (props) => {
	const note = props.note;
	const canvasTransform = ZoomTransform;

	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: note._id,
	  });
	
	  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`} : undefined;
	  
	return (
		<button className="card" ref={setNodeRef} style={style} {...listeners} {...attributes}>{note.content}
      </button>
	);
}

export default Note;