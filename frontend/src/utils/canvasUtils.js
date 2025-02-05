import { Canvas, Rect, Textbox, Group, FabricImage } from 'fabric';
import { updateNote } from '../services/notesAPI';

// General function for adding a note to the canvas
 export const addNoteToCanvas = (canvas, boardId, x, y, width = 200, height = 50, content = 'New Note', id = null) => {
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
                console.log(e);
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
        try {
            updateNote(noteGroup.id, boardId, {
                content: textbox.text
            }).then((res) => {
                console.log(res);
            })
        } catch (e) {
            console.log(e);
        }
	}
    });
  };