import { Base } from "./baseObject";
import { Rect, FabricImage, Control, controlsUtils, FabricObject } from "fabric";
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
            scale = {
                x: 0.5,
                y: 0.5,
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
            lockRotation: true,
            lockUniScaling: true,
            hasBorders: false,
            ...rest,
        });

        this.customBorder = customBorder;
        this.scaleX = scale.x;
        this.scaleY = scale.y;
        this.id = id;
        this.boardId = boardId;
        this.position = position;
        this.src = src;

        // Loads the image and adds it to the Image Object
        FabricImage.fromURL(src, {
            crossOrigin: "anonymous"
        }).then((img) => {
            img.set({
                scaleY: this.scaleY,
                scaleX: this.scaleX,
                left: position.x,
                top: position.y,
            })
            this.add(img);
            this.img = img;
            this.calcACoords();
            this.setCoords();
            this.canvas.renderAll();
        });

        this.initControl();
        this.setupEventListeners();
    };

    initControl() {
        this.setControlsVisibility({
            mtr: false,
            mt: false,
            mb: false,
            ml: false,
            mr: false,
            tl: false,
            tr: false,
            bl: false,
            br: true,
        });

        this.controls.br = new Control({
            x: 0.5,
            y: 0.5,
            cursorStyle: 'nwse-resize',
            actionHandler: controlsUtils.scalingEqually,
            actionName: 'scale',
            render: this.renderCircleControl,
        });
    };

    renderCircleControl(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(left, top, 6, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
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
                scale: {
                    x: this.scaleX,
                    y: this.scaleY,
                }
            }
            updateItem(this.id, this.boardId, "image", updates);
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
        scale: {
            x: 0.5,
            y: 0.5
        },
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