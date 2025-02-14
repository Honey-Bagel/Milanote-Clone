import { Rect, Textbox } from "fabric";
import { Base } from "./baseObject";
import { createItem, updateItem } from "../../services/itemAPI";
import { addBoard } from "../objectUtilities/objectUtilities";
export class Board extends Base {
    static type = "board";

    constructor(options = {}) {
        const {
            title = "My Board",
            width = 80,
            height = 80,
            maxTextWidth = 100,
            maxTextHeight = 100,
            backgroundColor = "#DCDCDC",
            textColor = "#DCDCDC",
            fontSize = 24,
            rx = 10,
            ry = 10,
            id = null,
            position = {
                x: 10,
                y: 10,
            },
            navigate = null,
            boardId = null,
            root = false,
            ...rest
        } = options;

        // Create background rect "square"
        const rect = new Rect({
            width,
            height,
            fill: backgroundColor,
            rx: 10,
            ry: 10,
            selectable: false,
            evented: true,
        });

        /*
        TODO - Add Icons to center of board object
        */

        // Create the custom border
        const customBorder = new Rect({
            width,
            height,
            left: -2,
            top: -2,
            rx: 10,
            ry: 10,
            stroke: 'grey',
            strokeWidth: 4,
            fill: 'transparent',
            selectable: false,
            evented: false,
            visible: false,
        });

        // Create text below square
        const textbox = new Textbox(title, {
            width: width * 2,
            height: 25,
            fontSize,
            fill: textColor,
            textAlign: "center",
            left: -width / 2,
            top: height,
            selectable: true,
            hasBorders: false,
            splitByGrapheme: true,
        });

        super([rect, textbox, customBorder], options={
            left: position.x,
            top: position.y,
            width,
            height,
            lockRotation: true,
            hasBorders: false,
            hasControls: false,
            subTargetCheck: true,
            ...rest,
        });
        
        this.rect = rect;
        this.textbox = textbox;
        this.customBorder = customBorder;
        this.title = title;
        this.textColor = textColor;
        this.fontSize = fontSize;
        this.rx = rx;
        this.ry = ry;
        this.id = id;
        this.position = position;
        this.navigate = navigate;
        this.boardId = boardId;
        this.color = backgroundColor;

        this.setupEventListeners();
    }

    setupEventListeners() {
        super.setupEventListeners();
        // Open the new board
        this.rect.on("mousedblclick", (event) => {
                this.openBoard();
        });

        /* Textbox Event Listeners */
        this.textbox.on("mousedblclick", () => {
            this.canvas?.setActiveObject(this.textbox);
            this.textbox.enterEditing();
            this.textbox.hiddenTextarea?.focus();
        });

        this.textbox.on("editing:entered", (event) => {
            //const index = this.textbox.text.length; // Starts the cursor at the end of the text
            const index = this.textbox.getSelectionStartFromPointer(event.e); // Starts the cursor at the mouse dblclick location

            this.textbox.selectionStart = index;
            this.textbox.selectionEnd = index;

            const exitEditingOnEnter = (event) => {
                if(event.key === "Enter") {
                    event.preventDefault();
                    this.textbox.exitEditing();
                    this.canvas?.discardActiveObject();
                    this.canvas?.renderAll();
                    window.removeEventListener("keydown", exitEditingOnEnter);
                }
            };
            window.addEventListener("keydown", exitEditingOnEnter);
        });

        this.textbox.on("editing:exited", () => {
            this.syncContent();
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
        });


    };

    syncContent() {
        if(this.textbox.hiddenTextarea) {
            this.textbox.hiddenTextarea.blur();
        }
        if(this.id) {
            updateItem(this.id, this.boardId, "boards", {
                title: this.textbox.text,
            });
        }
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

    // **Sync Note Position & Size**
    syncNotePosition() {
    if (this.boardId) {
        const updates = {
        position: { x: this.left, y: this.top },
        };
        updateItem(this.id, this.boardId, "boards", updates);
        this.canvas.bringObjectToFront(this);
    }
    };

    saveColor() {
        if(this.boardId) {
            const updates = {
                color: this.rect.fill,
            };
            updateItem(this.id, this.boardId, "boards", updates);
        }
    }

    openBoard() {
        if(this.navigate) {
            const id = this.id;
            const name = this.title;
            this.navigate(`/board/${this.id}`);
        }
    };

    getColor() {
        return this.rect.fill;
    };

    setColor(hex) {
        this.rect.set("fill", hex);
        this.saveColor();
    };

     // **Serialization (Save/Load)**
  toObject() {
    return {
      ...super.toObject(),
      content: this.content,
      backgroundColor: this.backgroundColor,
      textColor: this.textColor,
      fontSize: this.fontSize,
      rx: this.rx,
      ry: this.ry,
    };
  }

  static fromObject(object, callback) {
    return callback(new Board(object));
  }
}

// Helper function to call backend to create a board
export const createBoard = (canvasInstanceRef, boardId, userId, navigate, position={ x:0, y:0 }) => {
    const edge = 160;
    try {
        createItem(boardId, {
            title: "New Board",
            type: "board",
            owner: userId,
            root: false,
            position: {
                x: position.x - edge/2,
                y: position.y - edge/2,
            },
            board: boardId,
        }).then((res) => {
            const { type, board } = res.data;
            if(type !== "board") return;
            canvasInstanceRef.current.add(addBoard(board, res.data, navigate));
            console.log("Item added successfully");
        });
    } catch (e) {
        console.log(e);
    }
};