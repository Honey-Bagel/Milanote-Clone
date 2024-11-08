import React, { useEffect } from 'react';
import { Rect, Group, Textbox } from 'fabric';

// Define a custom Fabric.js Note class by extending fabric.Rect
export class CustomNote {
  constructor(options, canvas) {
    this.type = 'customNote';
    this.fill = options.fill || 'yellow';
    this.width = options.width || 150;
    this.height = options.height || 100;
    this.noteText = options.noteText || 'Click to edit';
    this.textColor = options.textColor || 'black';

    // Create the rectangle (background of the note)
    this.rect = new Rect({
      left: options.left || 100,
      top: options.top || 100,
      width: this.width,
      height: this.height,
      fill: this.fill,
      stroke: 'black',
      strokeWidth: 2,
    });

    // Create the Textbox (editable text inside the note)
    this.textbox = new Textbox(this.noteText, {
      left: options.left || 100,
      top: options.top || 100,
      width: this.width - 20, // Padding of 10 on each side
      height: this.height - 20, // Padding of 10 on each side
      fontSize: 16,
      fill: this.textColor,
      borderColor: 'transparent', // Optional: make border transparent for aesthetics
    });

    // Group the rectangle and the textbox together
    this.group = new Group([this.rect, this.textbox], {
      left: options.left || 100,
      top: options.top || 100,
    });

	canvas.add(this.group);

	this.group.set({
		selectable: true,
		hasControls: false,
	})

	canvas.on('mouse:down', (e) => {
		if(e.target === this.group) {
			this.textbox.set({ editable: true });
			canvas.renderAll();
		}
	})
  }

  

  // Get the text content of the note (useful for saving the text value)
  getText() {
    return this.textbox.text;
  }

  // Set the text content of the note
  setText(newText) {
    this.textbox.set({ text: newText });
    this.textbox.setCoords();
  }

  // Get the Fabric.js group (so it can be added to the canvas)
  getGroup() {
    return this.group;
  }
}

// React component to manage and add the custom note to a Fabric canvas
const CustomNoteComponent = ({ canvas }) => {
  useEffect(() => {
    if (canvas) {
      // Add a custom note with editable text to the canvas
      const note = new CustomNote({
        left: 100,
        top: 100,
        noteText: 'Click to edit',
        fill: 'lightblue',
        textColor: 'darkblue',
      });
      canvas.add(note.getGroup());  // Add the group to the canvas
      canvas.renderAll();
    }
  }, [canvas]);

  return null;
};

export default { CustomNoteComponent, CustomNote } ;
