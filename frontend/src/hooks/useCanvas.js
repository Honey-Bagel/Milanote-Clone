// hooks/useCanvas.js
import { useEffect, useState } from 'react';
import { Canvas, Rect, Textbox, Group } from 'fabric';
import { getNotes, createNote, updateNote, deleteNote } from '../services/notesAPI';
import { useNotesContext } from './useNotesContext';
import axios from 'axios';

const useCanvas = (canvasRef) => {
  const [canvas, setCanvas] = useState(null);
  const {notes, dispatch} = useNotesContext();

  useEffect(() => {
    const canvasInstance = new Canvas(canvasRef.current);
    canvasInstance.setWidth(1300);
    canvasInstance.setHeight(1100);
	canvasInstance.backgroundColor = "#ffffc4";
    setCanvas(canvasInstance);

	// Load notes from backend need to un-hardcode board id
	getNotes("66e92e7aa5b1e7b08104a097").then((res) => {
		console.log(res.d);
		dispatch({type: 'SET_NOTES', payload: res.data });
		res.data.forEach((note) => {
			addNoteToCanvas(canvasInstance, note.position.x, note.position.y, note.width, note.height, note.content, note._id);
		})
	})

	// Handle keyboard backspace/delete event to delete notes
	const handleKeyDown = (event) => {
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

	window.addEventListener('keydown', handleKeyDown);
	// end keyboard listener

    return () => {
		// clean up canvas to prevent leaks
		canvasInstance.dispose();
		window.removeEventListener('keydown', handleKeyDown);
	}
  }, [canvasRef]);

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
      fill: '#f0f0f0',
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
    });

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
		console.log('test');
		if(event.target.id === noteGroup.id) {
			updateNote(noteGroup.id, {position: {
				x: noteGroup.left,
				y: noteGroup.top,
			}}).then((res) => {
				console.log(res)
			})
		}
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
		board: "66e92e7aa5b1e7b08104a097",
	}

	// Send to backend
	createNote(noteBody).then((res) => {
		console.log(res);
		if(res.status >= 200 && res.status < 300) {
			console.log('good')
			addNoteToCanvas(canvas, res.data.position.x, res.data.position.y, res.data.width, res.data.height, res.data.content, res.data._id);
			canvas.renderAll();
		}
	}).catch(console.error);
  };

  return { canvas, addNote };
};

export default useCanvas;
