import React from 'react';
import { useDraggable } from '@dnd-kit/core';

const Note = (props) => {
	const note = props.note;
	const styles = props.styles;

	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: note._id,
	  });
	
	  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`} : {};
	  
	return (
		<button className="card" ref={setNodeRef} style={{ ...style, ...styles}} {...listeners} {...attributes}>
			<h1>{note.title}</h1>
			<div className="card-body">
				{note.content}
			</div>
      </button>
	);
}

export default Note;