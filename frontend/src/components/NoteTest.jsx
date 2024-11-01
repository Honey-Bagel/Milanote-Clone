import { useState, useRef } from 'react';

import { setZIndex } from '../utils';

const NoteCard = (props) => {
	const [position, setPosition] = useState(props.canvasTransform);
	const note = props.note;

	let mouseStartPos = { x: 0, y: 0 };

	const cardRef = useRef(null);


	const mouseDown = (e) => {
		console.log('mouse down')
		setZIndex(cardRef.current);

		mouseStartPos.x = e.clientX;
		mouseStartPos.y = e.clientY;

		document.addEventListener("mousemove", mouseMove);
		document.addEventListener("mouseup", mouseUp);
	}

	const mouseUp = () => {
		document.removeEventListener("mousemove", mouseMove);
		document.removeEventListener("mouseup", mouseUp);
	}

	const mouseMove = (e) => {

		let mouseMoveDir = {
			x: mouseStartPos.x - e.clientX,
			y: mouseStartPos.y - e.clientY,
		};

		mouseStartPos.x = e.clientX;
		mouseStartPos.y = e.clientY;

		setPosition({
			x: cardRef.current.offsetLeft - mouseMoveDir.x,
			y: cardRef.current.offsetTop - mouseMoveDir.y,
		});
	};

	return (
		<div className="card"
			ref={cardRef}
			style={{
				left: `${position.x}px`,
				top: `${position.y}px`
			}}
			onPointerDown={(e) => {
				e.preventDefault();
			}}
			>
			<div className="card-header" onMouseDown={mouseDown}>header</div>
			<div className="card-body">
				<textarea
					defaultValue={note.content}
					></textarea>
			</div>
		</div>
	)

}

export default NoteCard;