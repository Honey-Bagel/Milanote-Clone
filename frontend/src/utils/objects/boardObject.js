import { Rect, Textbox, Group } from "fabric";

export class Board extends Group {
    static type = "board";

    constructor(options = {}) {
        const {
            title = "My Board",
            width = 50,
            height = 50,
            maxTextWidth = 100,
            maxTextHeight = 100,
            backgroundColor = "#DCDCDC",
            textColor = "#000000",
            fontSize = 24,
            rx = 10,
            ry = 10,
            id = null,
            position = {
                x: 10,
                y: 10,
            },
            ...rest
        } = options;

        // Create background rect "square"
        const rect = new Rect({
            width,
            height,
            fill: backgroundColor,
            rx,
            ry,
            selectable: false,
            evented: false,
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
            rx,
            ry,
            stroke: 'grey',
            strokeWidth: 4,
            fill: 'transparent',
            selectable: false,
            evented: false,
            visible: false,
        });

        // Create text below square
        const textbox = new Textbox(title, {
            width: 50,
            height: 25,
            textAlign: "center",
            top: 50,
            selectable: false,
            hasBorders: false,
            splitByGrapheme: true,
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

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Open the new board
        this.on("mousedblclick", () => {
            this.openBoard();
        });


    }
}