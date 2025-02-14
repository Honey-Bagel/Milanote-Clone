import { Group, Rect, Textbox} from "fabric";
import { updateItem } from "../../services/itemAPI";

export class Base extends Group {
    static type = "base";

    constructor(elements = [], options = {}) {
        const {
            boardId = null,
            id = null,
            color = "#DCDCDC",
            objects = null,
            ...rest
        } = options;

        super(elements, options);

        this.boardId = boardId;
        this.id = id;
        this.color = color;
        this.objects = this.objects;

    }

    setupEventListeners() {
        
    }

    setColor() {
        console.log('Parent set color')
    }

    getColor() {
        console.log('Parent get color');
    }
}