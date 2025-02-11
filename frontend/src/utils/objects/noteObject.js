import { Rect, Textbox, Group } from "fabric";
import { createItem, updateItem } from "../../services/itemAPI";
import { addNote } from '../../utils/objectUtilities/objectUtilities';

export class Note extends Group {
  static type = "note";

  constructor(options = {}) {
    const {
      content = "New Nota",
      width = 200,
      height = 100,
      backgroundColor = "#DCDCDC",
      textColor = "#000000",
      fontSize = 24,
      textAlign = "left",
      rx = 10, // Rounded corners
      ry = 10,
      boardId = null, // Optional: Store board ID if needed
      id = null,
      position = {
        x: 10,
        y: 10,
      },
      ...rest
    } = options;

    // Create the background rectangle
    const rect = new Rect({
      width,
      height,
      fill: backgroundColor,
      stroke: "#ccc",
      strokeWidth: 1,
      rx: 10,
      ry: 10,
      strokeLineJoin: "round",
      selectable: false,
      evented: false, // Prevent direct selection
    });

    // Create the custom border
    const customBorder = new Rect({
        width,
        height,
        left: -2,
        top: -2,
        rx,
        ry,
        stroke: 'grey',
        strokeWidth: 4,
        fill: 'transparent',
        selectable: false,
        evented: false,
        visible: false,
    });

    // Create the text inside the note
    const textbox = new Textbox(content, {
      width: width - 20,
      fontSize,
      textAlign,
      left: 10,
      top: 10,
      selectable: false, // Only editable on double-click
      hasBorders: false,
      splitByGrapheme: true
    });

    super([rect, textbox, customBorder], {
      left: position.x,
      top: position.y,
      width,
      height,
      lockRotation: true,
      hasBorders: false,
      hasControls: false,
      rx: 10,
      ry: 10,
      ...rest,
    });
    
    // Store properties
    this.rect = rect;
    this.textbox = textbox;
    this.customBorder = customBorder;
    this.content = content;
    this.textColor = textColor;
    this.fontSize = fontSize;
    this.textAlign = textAlign;
    this.rx = rx;
    this.ry = ry;
    this.boardId = boardId;
    this.id = id;
    this.position = position;

    // **Bind Events**
    this.setupEventListeners();
  }

  // **Attach Events**
  setupEventListeners() {
    // **Double-click to edit text**
    this.on("mousedblclick", () => {
      this.enterEditingMode();
    });

    // **Auto-resize background when text changes**
    this.textbox.on("changed", () => {
      this.resizeToFitText();
    });

    // **Update backend when text editing is done**
    this.textbox.on("editing:exited", () => {
      this.syncNoteContent();
    });

    // **Save position & size when note is moved or resized**
    this.on("modified", () => {
      this.syncNotePosition();
    });

    // **Prevent unwanted scaling**
    this.on("scaled", () => {
      this.set({ scaleX: 1, scaleY: 1 });
      this.canvas?.renderAll();
    });

    this.on("selected", () => {
        this.toggleCustomBorder(true);
        this.canvas?.renderAll();
    });
    
    this.on("deselected", () => {
        this.toggleCustomBorder(false);
        this.canvas?.renderAll();
    })
  }

  toggleCustomBorder(toggle = null) {
    if(toggle) {
        this.customBorder.set({
            visible: toggle
        });
    } else {
        this.customBorder.set({
            visible: !this.customBorder.visible,
        });
    }
  }

  // **Enter Text Editing Mode**
  enterEditingMode() {
    this.textbox.set({ selectable: true });
    this.canvas?.setActiveObject(this.textbox);
    this.textbox.enterEditing();
    this.textbox.hiddenTextarea?.focus();
  }

  // **Resize Background to Fit Text**
  resizeToFitText() {
    const boundingRect = this.textbox.getBoundingRect();
    this.rect.set({
      height: boundingRect.height + 20, // Adjust for padding
    });
    this.canvas?.renderAll();
  }

  // **Sync Note Position & Size**
  syncNotePosition() {
    if (this.boardId) {
      const updates = {
        position: { x: this.left, y: this.top },
        width: Math.round(this.width),
        height: Math.round(this.height),
      };
      updateItem(this.id, this.boardId, "notes", updates);
      this.canvas.bringObjectToFront(this);
    }
  }

  // **Sync Note Content**
  syncNoteContent() {
    if(this.textbox.hiddenTextarea) {
        this.textbox.hiddenTextarea.blur();
    }
    if(this.id) {
        try {
            updateItem(this.id, this.boardId, "notes", {
                content: this.textbox.text,
            }).then((res) => {
                console.log(res);
            });
        } catch (e) {
            console.log(e);
        }
    }
  }

  // **Serialization (Save/Load)**
  toObject() {
    return {
      ...super.toObject(),
      content: this.content,
      backgroundColor: this.backgroundColor,
      textColor: this.textColor,
      fontSize: this.fontSize,
      textAlign: this.textAlign,
      rx: this.rx,
      ry: this.ry,
    };
  }

  static fromObject(object, callback) {
    return callback(new Note(object));
  }
}

// Helper function to call backend to create a note
export const createNote = (canvasInstanceRef, boardId, position={x: 0, y: 0}) => {
    const width = 200;
    const height = 50;
    const realPosition = {
        x: position.x - width/2,
        y: position.y - height/2,
    }
    try {
        createItem(boardId, {
            title: "Note",
            content: "New Note",
            type: "note",
            position: realPosition,
            width,
            height,
            board: boardId,
        }).then((res) => {
			const { type, board } = res.data;
			if(type !== "note") return;
			canvasInstanceRef.current.add(addNote(board, res.data));
			console.log('Item added successfully')
        });
    } catch (e) {
		console.log(e);
	}
}