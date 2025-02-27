import { Base } from "./baseObject";
import { Rect, FabricImage } from "fabric";
import { updateItem } from "../../services/itemAPI";
import { addImage, addNote } from "../objectUtilities/objectUtilities";
import { createImage } from "../../services/imagesAPI";

export class Image extends Base {
    static type = "image";

    constructor(options = {}) {
        const {
            src = null,
            width = 50,
            height = 50,
            id = null,
            position = {
                x: 10,
                y: 10,
            },
            boardId = null,
            ...rest
        } = options;

        const rect = new Rect({
            width,
            height,
            fill: "#ffffff",
            rx: 10,
            ry: 10,
            selectable: false,
            evented: true,
        });


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

        super([customBorder], options={
            left: position.x,
            top: position.y,
            width,
            height,
            lockRotation:true,
            hasBorders: false,
            hasControls: false,
            ...rest,
        });

        this.rect = rect;
        this.customBorder = customBorder;
        this.id = id;
        this.boardId = boardId;
        this.poistion = position;
        this.src = src;

        this.setupEventListeners();
    };

    setupEventListeners() {
        super.setupEventListeners();
    };

    getColor() {

    }

    setColor(hex) {}

    toObject() {
        return {
            ...super.toObject(),
            src: this.src,
        };
    };

    static fromObject(object, callback) {
        return callback(new Image(object));
    };
};

// helper function to call backend to create an image
export const createImageObject = (canvasInstanceRef, formData) => {
    const width = 100;
    const height = 100;
    const position = { x: 0, y: 0};
    formData.append("options", {position});
    try {
        createImage(formData).then((res) => {
            const image = res.data.newImage;
            const { boardId } = image;
            if(!image) return;
            canvasInstanceRef.current.add(addImage(boardId, image));
        });
    } catch (e) {
        console.log(e);
    }
};