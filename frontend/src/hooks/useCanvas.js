// hooks/useCanvas.js
import { useEffect, useState } from 'react';
import { Canvas, Rect, Textbox, Group, Control, FabricImage } from 'fabric';
import { getNotes, createNote, updateNote, deleteNote } from '../services/notesAPI';
import { getImages, createImage, deleteImage, updateImage } from '../services/imagesAPI';
import { useNotesContext } from './useNotesContext';
import { useAuthContext } from './useAuthContext';
import socket from '../utils/socket';


const useCanvas = (canvasRef, board) => {
  const boardId = board.boardId;
  const { user } = useAuthContext();
  const [canvas, setCanvas] = useState(null);
  const {notes, dispatch} = useNotesContext();
  const EXPAND_THRESHOLD = 100;
  const EXPAND_AMOUNT = 500;

  useEffect(() => {
	if(!user) return;
    const canvasInstance = new Canvas(canvasRef.current);
	const { innerWidth, innerHeight } = window;
    canvasInstance.setWidth(1300);
    canvasInstance.setHeight(1100);
	canvasInstance.backgroundColor = "#222222";
	let viewportWidth = canvasInstance.getWidth();
	let viewportHeight = canvasInstance.getHeight();
    setCanvas(canvasInstance);


	socket.on('noteUpdated', ({ id, updates }) => {
		const note = canvasInstance.getObjects().find(obj => obj.id === id);
		if(note) {
			if(updates.position && updates.width && updates.height) {
			note.set({
				top: updates.position.y,
				left: updates.position.x,
				width: updates.width,
				height: updates.height
			})
			}
			if(updates.content) {
				note.textbot.set({
					text: updates.content
				})
			}

			canvasInstance.renderAll();
		}
	});

	socket.on('noteCreated', ({ note }) => {
		if(note) {
			addNoteToCanvas(canvasInstance, note.position.x, note.position.y, note.width, note.height, note.content, note._id);
			canvasInstance.renderAll();
		}
	});

	socket.on('noteDeleted', ({ id }) => {
		const note = canvasInstance.getObjects().find(obj => obj.id === id);
		if(note) {
			canvasInstance.remove(note);
			canvasInstance.renderAll();
		}
	});

	// Load notes from backend need to un-hardcode board id
	try {
		getNotes(boardId).then((res) => {
			dispatch({type: 'SET_NOTES', payload: res.data });
			res.data.forEach((note) => {
				addNoteToCanvas(canvasInstance, note.position.x, note.position.y, note.width, note.height, note.content, note._id);
			})
		});
	} catch (error) {

	}

	getImages(user.rootBoard).then((res) => {
		res.data.forEach((image) => {
			FabricImage.fromURL(image.src, (fabricImage) => {
				fabricImage.set({
					left: image.left,
					top: image.top,
					scaleX: image.scaleX,
					scaleY: image.scaleY,
					angle: image.angle,
				});
				canvasInstance.add(fabricImage);
			})
		})
	})

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
		}
		if(canvasInstance.getHeight() - panY + (deltaY * 30) <= viewportHeight && ((deltaY * 30) - panY) >= 0) {
			canvasInstance.relativePan({ x: 0, y: -deltaY * 30 });
		}
	});
	
	const handleDrop = (e) => {
		e.preventDefault();
		const files = e.dataTransfer.files;

		if(files.length > 0) {
			const file = files[0];
			const reader = new FileReader();

			reader.onload = (event) => {
				const img = new Image();
				img.onload = () => {
					const fabricImage = new FabricImage(img, {
						left: e.offsetX,
						top: e.offsetY,
						selectable: true,
					});
					canvasInstance.add(fabricImage);
					canvasInstance.renderAll();

					const imageData = {
						boardId: user.boardId,
						src: event.target.result,
						left: e.offsetX,
						right: e.offsetY,
						width: img.width,
						height: img.height,
						scaleX: 1,
						scaleY: 1,
						angle: 0,
					};
					createImage(imageData);
				};
				img.src = event.target.result;
			};
			reader.readAsDataURL(file);
		}
	}
	const handleDragOver = (e) => {
		e.preventDefault();
	}

	const canvasContainer = document.getElementById('canvas-container');
	canvasContainer.addEventListener('dragover', handleDragOver);
	canvasContainer.addEventListener('drop', handleDrop);

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
	  
		if (objectBottom > newViewportHeight - EXPAND_THRESHOLD) {
			newViewportHeight = objectBottom + EXPAND_AMOUNT;
		} else {
			newViewportHeight = 1100;
		} 

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

	/** Milanote doesn't implement idk if I should */
	// canvasInstance.on('object:removed', (e) => {
	// 	let maxRight = 0;
	// 	let maxBottom = 0;

	// 	canvasInstance.getObjects().forEach((obj) => {
	// 		const rightEdge = obj.left + obj.width * obj.scaleY;
	// 		const bottomEdge = obj.top + obj.height * obj.scaleY;

	// 		maxRight = Math.max(maxRight, rightEdge);
	// 		maxBottom = Math.max(maxBottom, bottomEdge);
	// 	});

	// 	const newWidth = Math.max(1300, maxRight + EXPAND_THRESHOLD);
	// 	const newHeight = Math.max(1100, maxBottom + EXPAND_THRESHOLD);

	// 	if(newWidth < viewportWidth || newHeight < viewportHeight) {
	// 		const panX = canvasInstance.viewportTransform[4];
	// 		const panY = canvasInstance.viewportTransform[5];
	// 		console.log('pan: ', panX, panY);

	// 		const newPanX = panX + (viewportWidth - newWidth);
	// 		const newPanY = panY + (viewportHeight - newHeight);
	// 		//console.log(newPanX, newPanY);
	// 		console.log(viewportHeight - newHeight);

	// 		viewportWidth = newWidth;
	// 		viewportHeight = newHeight;
	// 		canvasInstance.relativePan({ x: panX , y: panY + 50 });
	// 		canvasInstance.renderAll();
	// 		console.log('changed height/width')
	// 	};
	// });

	// canvasInstance.on('object:removed', (e) => {
	// 	canvasInstance.getObjects().forEach((obj) => {
	// 		console.log(obj);
	// 	})
	// })

	// Handle keyboard backspace/delete event to delete notes
	
	const handleKeyDown = (event) => {
		if(canvasInstance.getActiveObject() && canvasInstance.getActiveObject().type && canvasInstance.getActiveObject().type === 'textbox') {
			return;
		}
		if((event.key === 'Delete' || event.key === 'Backspace') && canvasInstance.getActiveObjects().length >= 1) {
			canvasInstance.getActiveObjects().forEach((obj) => {
				const activeObject = obj;
				if(activeObject.id) {
					try {
						deleteNote(activeObject.id, boardId).then((res) => {
						if(res.status >= 200 && res.status < 300) {
							canvasInstance.remove(activeObject);
						}
					}).catch(console.error);
					} catch (error) {

					}	
				};
			});
			canvasInstance.renderAll();
			canvasInstance.discardActiveObject();
			
		}
	};

	window.addEventListener('keydown', handleKeyDown);
	// end keyboard listener

    return () => {
		// clean up canvas to prevent leaks
		canvasInstance.dispose();
		window.removeEventListener('keydown', handleKeyDown);
		canvasContainer.removeEventListener('dragover', handleDragOver);
		canvasContainer.removeEventListener('drop', handleDrop);
	}
  }, [canvasRef, user]);

  // General function for adding a note to the canvas
  const addNoteToCanvas = (canvas, x, y, width = 200, height = 50, content = 'New Note', id = null) => {
	if(!canvas) return;

	// create the textbox part
	const textbox = new Textbox(content, {
		width: width - 2 * 10,
		height: height,
		fontSize: 24,
		editable: true,
		textAlign: 'left',
		left: 10,
		top: 10,
		splitByGrapheme: true,
		selectable: false
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
	  selectable: false
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
			try {
				updateNote(noteGroup.id, boardId, {
					position: {
					x: noteGroup.left,
					y: noteGroup.top,
					},
					width: Math.round(noteGroup.width),
					height: Math.round(noteGroup.height),
				}).then((res) => {
					//console.log(res)
				})
			} catch (e) {

			}
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
		board: boardId,
	}

	// Send to backend
	try {
		createNote(noteBody, boardId).then((res) => {
			console.log(res);
			if(res.status >= 200 && res.status < 300) {
				addNoteToCanvas(canvas, res.data.position.x, res.data.position.y, res.data.width, res.data.height, res.data.content, res.data._id);
				canvas.renderAll();
			}
		}).catch(console.error);
	} catch (e) {
		
	}
	
  };

  return { canvas, addNote };
};

export default useCanvas;
