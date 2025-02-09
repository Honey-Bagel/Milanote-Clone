import { Group } from "fabric";
import { updateItem } from "../../services/itemAPI";

export class Base extends Group {
    static type = "base";

    constructor(options = {}) {
        const {
            boardId = null,
            id = null,
            position = {
                x: 10,
                y: 10,
            },
            width = 100,
            height = 50,
            ...rest
        } = options;

        super();

        this.boardId = boardId;
        this.id = id;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.on("modified", () => {
            this.syncNotePosition();
        });

        this.on("scaled", () => {
            this.set({ scaleX: 1, scaleY: 1 });
            this.canvas?.renderAll();
        });
    }

    syncNotePosition() {
        if(this.boardId) {
            const updates = {
                position: { x: this.left, y: this.top },
                width: Math.round(this.width),
                height: Math.round(this.height),
            };
            updateItem(this.id, this.boardId, updates);
        }
    }
}