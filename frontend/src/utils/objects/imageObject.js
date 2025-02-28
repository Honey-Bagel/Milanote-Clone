import { Base } from "./baseObject";
import { Rect, FabricImage } from "fabric";
import { updateItem } from "../../services/itemAPI";
import { addImage, addNote } from "../objectUtilities/objectUtilities";
import { createImage } from "../../services/imagesAPI";

export class Image extends Base {
    static type = "image";

    constructor(options = {}, callback) {
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

        this.customBorder = customBorder;
        this.id = id;
        this.boardId = boardId;
        this.position = position;
        this.src = src;

        // Loads the image and adds it to the Image Object
        FabricImage.fromURL(src, {
            crossOrigin: "anonymous"
        }).then((img) => {
            img.set({
                scaleY: 0.5,
                scaleX: 0.5,
                left: position.x,
                top: position.y,
            })
            this.add(img);
            this.img = img;
            this.calcACoords();
            this.setCoords();
            this.canvas.renderAll();
        });

        this.setupEventListeners();
    };

    setupEventListeners() {
        super.setupEventListeners();

        this.on("modified", () => {
            this.syncPosition();
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

    toggleCustomBorder(toggle = null) {
        if(toggle != null) {
            this.customBorder.set({
                visible: toggle
            });
        } else {
            this.customBorder.set({
                visible: !this.customBorder.visible,
            });
        }
    };

    syncPosition() {
        if(this.boardId) {
            const updates = {
                position: { x: this.left, y: this.top },
                width: Math.round(this.width),
                height: Math.round(this.height),
            }
            updateItem(this.id, this.boardId, "images", updates);
            this.canvas.bringObjectToFront();
        }
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
export const createImageObject = (canvasInstanceRef, formData, boardId, position={ x: 0, y: 0 }) => {
    const width = 100;
    const height = 100;
    const board = boardId;
    const type = "image";
    const options = {
        position: position,
        board,
        type,
    }
    formData.append("options", JSON.stringify(options));
    try {
        createImage(formData).then(async (res) => {
            const image = res.data.newImage;
            const { boardId } = image;
            if(!image) return;
            canvasInstanceRef.current.add(addImage(boardId, image));
        });
    } catch (e) {
        console.log(e);
    }
};