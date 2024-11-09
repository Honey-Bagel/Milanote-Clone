// hooks/useCanvas.js
import { useEffect, useState } from 'react';
import { Canvas, Rect, Textbox, Group, Control } from 'fabric';
import { getNotes, createNote, updateNote, deleteNote } from '../services/notesAPI';
import { useNotesContext } from './useNotesContext';
import { useAuthContext } from './useAuthContext';

const useCanvas = (canvasRef) => {
  const { user } = useAuthContext();
  const [canvas, setCanvas] = useState(null);
  const {notes, dispatch} = useNotesContext();
  const EXPAND_THRESHOLD = 100;
  const EXPAND_AMOUNT = 500;

  useEffect(() => {
	if(!user) return;
    const canvasInstance = new Canvas(canvasRef.current);
    canvasInstance.setWidth(1300);
    canvasInstance.setHeight(1100);
	canvasInstance.backgroundColor = "#222222";
	let viewportWidth = canvasInstance.getWidth();
	let viewportHeight = canvasInstance.getHeight();
    setCanvas(canvasInstance);

	// Load notes from backend need to un-hardcode board id
	getNotes(user.rootBoard).then((res) => {
		dispatch({type: 'SET_NOTES', payload: res.data });
		res.data.forEach((note) => {
			addNoteToCanvas(canvasInstance, note.position.x, note.position.y, note.width, note.height, note.content, note._id);
		})
	});

	canvasInstance.on('mouse:wheel', (event) => {
		event.e.preventDefault();
		event.e.stopPropagation();
		let deltaX = 0
		let deltaY = 0;
		if(event.e.shiftKey) {
			deltaX = event.e.deltaY > 0 ? 1 : -1;
		} else {
			deltaY = event.e.deltaY > 0 ? 1 : -1;
		}
		const panX = canvasInstance.viewportTransform[4];
		const panY = canvasInstance.viewportTransform[5];
		
		if(canvasInstance.getWidth() - panX + (deltaX * 30) <= viewportWidth && ((deltaX * 30) - panX) > 0) {
			canvasInstance.relativePan({ x: -deltaX * 30, y: 0});
		} else if(canvasInstance.getHeight() - panY + (deltaY * 30) <= viewportHeight && ((deltaY * 30) - panY) > 0) {
			canvasInstance.relativePan({ x: 0, y: -deltaY * 30 });
		}
	})

	const checkCanvasEdges = (object) => {
		let newViewportHeight = canvasInstance.height;
		let newViewportWidth = canvasInstance.width;

		const objectLeft = object.left;
		const objectRight = object.left + object.width * object.scaleX;
		const objectTop = object.top;
		const objectBottom = object.top + object.height * object.scaleY;

		const panX = canvasInstance.viewportTransform[4];
		const panY = canvasInstance.viewportTransform[5];
		console.log(newViewportHeight + panY - EXPAND_THRESHOLD, newViewportHeight - EXPAND_AMOUNT + panY)

		if (objectRight > newViewportWidth - EXPAND_THRESHOLD) {
			newViewportWidth += objectRight + EXPAND_AMOUNT;
		} else {
			newViewportWidth = 1300;
		}
		// if (objectLeft < EXPAND_THRESHOLD) {
		// 	newViewportWidth = Math.max(newViewportWidth, obj.width * obj.scaleX);
		// }
	  
		if (objectBottom > newViewportHeight - EXPAND_THRESHOLD) {
			newViewportHeight = objectBottom + EXPAND_AMOUNT;
		} else {
			newViewportHeight = 1100;
		} 
		// if (objectTop < EXPAND_THRESHOLD) {
		// 	newViewportHeight = Math.max(newViewportHeight, obj.height * obj.scaleY);
		// }

		if(viewportHeight < newViewportHeight) {
			viewportHeight = newViewportHeight;
		}
		if(viewportWidth < newViewportWidth) {
			viewportWidth = newViewportWidth;
		}
		
		canvasInstance.renderAll();
	}

	canvasInstance.on('object:modified', (e) => {
		checkCanvasEdges(e.target);
	})

	canvasInstance.on('object:added', (e) => {
		checkCanvasEdges(e.target);
	})

	canvasInstance.on('object:removed', (e) => {
		canvasInstance.getObjects().forEach((obj) => {
			checkCanvasEdges(obj)
		})
	})

	// Handle keyboard backspace/delete event to delete notes
	const handleKeyDown = (event) => {
		if(canvasInstance.getActiveObject() && canvasInstance.getActiveObject().type && canvasInstance.getActiveObject().type === 'textbox') {
			return;
		}
		if((event.key === 'Delete' || event.key === 'Backspace') && canvasInstance.getActiveObjects().length >= 1) {
			canvasInstance.getActiveObjects().forEach((obj) => {
				const activeObject = obj;
				if(activeObject.id) {
					deleteNote(activeObject.id).then((res) => {
						if(res.status >= 200 && res.status < 300) {
							canvasInstance.remove(activeObject);
						}
					}).catch(console.error);
				};
			});
			canvasInstance.discardActiveObject();
			
		}
	};

	// canvasInstance.on('selection:created', (e) => {

	// 	e.selected.forEach((obj) => {
	// 		const selectionRect = new Rect({
	// 			left: obj.left - 5,
	// 			top: obj.top - 5,
	// 			width: obj.width,
	// 			height: obj.height,
	// 			fill: 'transparent',
	// 			stroke: 'blue',
	// 			strokeWidth: 5,
	// 			selectable: false,
	// 			rx: 10,
	// 			  ry: 10,
	// 		})

	// 		canvasInstance.add(selectionRect);
	// 		obj.selectionRect = selectionRect;
	// 	})

	// 	canvasInstance.renderAll();
	// })
	
	// canvasInstance.on('selection:cleared', (e) => {
	// 	e.deselected.forEach((obj) => {
	// 		if(obj.selectionRect) {
	// 			canvasInstance.remove(obj.selectionRect);
	// 		}
	// 	})
	// })

	window.addEventListener('keydown', handleKeyDown);
	// end keyboard listener

    return () => {
		// clean up canvas to prevent leaks
		canvasInstance.dispose();
		window.removeEventListener('keydown', handleKeyDown);
	}
  }, [canvasRef, user]);

  // General function for adding a note to the canvas
  const addNoteToCanvas = (canvas, x, y, width = 200, height = 50, content = 'New Note', id = null) => {

	// create the textbox part
	const textbox = new Textbox(content, {
		width: width - 2 * 10,
		height: height,
		fontSize: 24,
		editable: true,
		textAlign: 'left',
		left: 10,
		top: 10,
		splitByGrapheme: true
	  });

	  // note the text height to ensure rect is big enough to hold all the text
	const textHeight = textbox.getBoundingRect().height;

	// construct a rect for the background of the note
    const rect = new Rect({
      width,
      height: textHeight + 20,
      fill: '#DCDCDC',
      stroke: '#ccc',
      strokeWidth: 1,
      rx: 10,
      ry: 10,
    });

    // Group the textbox and rectangle
    const noteGroup = new Group([rect, textbox], {
      left: x,
      top: y,
      id: id,
      selectable: true,
	  lockRotation: true,
	  hasBorders: true,
    });

	noteGroup.setControlsVisibility({
		mt: false,
		mb: false,
		ml: false,
		mr: false,
		tl: false,
		tr: false,
		bl: false,
		mtr: false,
		br: false
	})

	// Handles scaling / resizing

    // Add the group to the canvas
    canvas.add(noteGroup);

    // Ensure textbox is editable when the group is clicked
    noteGroup.on('mousedblclick', (e) => {
      const targetTextbox = noteGroup.item(1); // Index 1 refers to the textbox in our group [rect, textbox]
      if (targetTextbox) {
        canvas.setActiveObject(targetTextbox); // Set the textbox as the active object
        targetTextbox.enterEditing();          // Enter editing mode for the textbox
        targetTextbox.hiddenTextarea.focus();  // Focus the hidden input for immediate typing
      }
    });

	// Ensure the background rect grows as the text box gets bigger
	textbox.on('changed', () => {
		const boundingRect = textbox.getBoundingRect();
		rect.set({
		  height: boundingRect.height + 2 * 10, // Adjust height based on textbox height plus padding
		});
		canvas.renderAll();         // Re-render canvas to apply changes
	  });

	// When the note is modified save the changes to the db
	noteGroup.on('modified', (event) => {
		if(event.target.id === noteGroup.id) {
			updateNote(noteGroup.id, {
				position: {
				x: noteGroup.left,
				y: noteGroup.top,
				},
				width: Math.round(noteGroup.width),
				height: Math.round(noteGroup.height),
		}).then((res) => {
				//console.log(res)
			})
		}
	});

	noteGroup.on('scaled', () => {
		noteGroup.set({ scaleX: 1, scaleY: 1 })
		canvas.renderAll();
	})

    // Update backend with content changes when editing is done
    textbox.on('editing:exited', () => {
      if (noteGroup.id) {
		updateNote(noteGroup.id, {
			content: textbox.text
		}).then((res) => {
			console.log(res);
		})
	}
    });
  };

  const addNote = (x, y) => {
    if (!canvas) return;

	// Construct a new json note
	if(!user) return;
	const noteBody = {
		title: "new note",
		content: 'New Note',
		type: "text",
		position: {
			x,
			y,
		},
		width: 200,
		height: 50,
		board: user.rootBoard,
	}

	// Send to backend
	createNote(noteBody).then((res) => {
		console.log(res);
		if(res.status >= 200 && res.status < 300) {
			addNoteToCanvas(canvas, res.data.position.x, res.data.position.y, res.data.width, res.data.height, res.data.content, res.data._id);
			canvas.renderAll();
		}
	}).catch(console.error);
  };

  return { canvas, addNote };
};

export default useCanvas;
