import { Rect, Textbox, Group } from 'fabric';
import { updateNote } from '../../services/notesAPI';

// Handles adding a note object to the canvas
export const addNoteType = (canvas, boardId, info) => {
    const { content, width, height, position, _id } = info;
    const { x, y } = position;
    const textbox = new Textbox(content, { // Construct the textbox component for the note
            width: width - 2 * 10,
            height: height,
            fontSize: 24,
            editable: true,
            textAlign: 'left',
            left: 10,
            top: 10,
            splitByGrapheme: true,
            hasBorders: false,
          });
    
          // note the text height to ensure rect is big enough to hold all the text
        const textHeight = textbox.getBoundingRect().height;
    
        // construct a rect for the background of the note
        const rect = new Rect({ // Construct the rectangle background component for the note
          width,
          height: textHeight + 20, // add 20px of padding to the text box
          fill: '#DCDCDC',
          stroke: '#ccc',
          strokeWidth: 1,
          rx: 10,
          ry: 10,
        });
    
        // Group the textbox and rectangle
        const noteGroup = new Group([rect, textbox], { // Combine the textbox and rect into a group
          left: x,
          top: y,
          id: _id,
          selectable: true,
          lockRotation: true,
          hasBorders: false,
        });
    
        noteGroup.setControlsVisibility({ // disables all handles for the object (for future work)
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

        return noteGroup; // returns the object
};

export const addNoteEventListeners = (canvas, boardId, object) => {
    const rect = object.item(0);
    const textbox = object.item(1);

    // Ensure textbox is editable when the group is clicked -- TODO: start cursor at end of note
    object.on('mousedblclick', (e) => {
        const targetTextbox = object.item(1); // Index 1 refers to the textbox in our group [rect, textbox]
        if(targetTextbox) {
            canvas.setActiveObject(targetTextbox); // Set the textbox as the active object
            targetTextbox.enterEditing(); // Enter editing mode for the textbox
            targetTextbox.hiddenTextarea.focus(); // Focus the hidden input for immediate typing
        };
    });

    // Ensure the background rect grows as the text box gets bigger
    textbox.on('changed', () => {
        const boundingRect = textbox.getBoundingRect();
        rect.set({
            height: boundingRect.height + 2 * 10, // Adjust height based on textbox height plus padding
        });
        canvas.renderAll(); // Re-render canvas to apply changes
    });

    // Update the note to save the text when the textbox is unfocused
    textbox.on('editing:exited', () => {
        if(textbox.hiddenTextarea) {
            textbox.hiddenTextarea.blur();
        }
        if(object.id) { // Check if object id exists
            try {
                updateNote(object.id, boardId, { // Update the note matching the id
                    content: textbox.text
                }).then((res) => {
                    console.log(res);
                });
            } catch (e) {
                console.log(e);
            }
        }
    });
}