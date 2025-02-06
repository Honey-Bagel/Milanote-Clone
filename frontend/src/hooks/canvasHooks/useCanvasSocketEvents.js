import { addObjectToCanvas } from '../../utils/canvasUtils';
import socket from '../../utils/socket';
import { useEffect } from 'react';

export const useCanvasSocketEvents = (boardId, canvasRef) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if(!socket || !canvas) return; 

        // Handles when objects are updated
        socket.on('noteUpdated', ({ id, updates }) => {
            const note = canvas.getObjects().find(obj => obj.id === id);
            if(!note) return;
            if(updates.position && updates.width && updates.height) {
                console.log('pos', updates.position);
                note.set({
                    top: updates.position.y,
                    left: updates.position.x,
                    width: updates.width,
                    height: updates.height,
                });
                note.setCoords();
            }

            if(updates.content) {
                // NEED TO FIX - textbox doesnt resize here
                let rect;
                let textbox;
                note.forEachObject((obj) => {
                    if(obj.type === 'textbox') {
                        textbox = obj;
                        obj.set({
                            text: updates.content,
                        });
                    } else if(obj.type === 'rect') {
                        rect = obj;
                    }
                });
                
                if(updates.height) {
                    rect.setHeight(updates.height);
                    rect.setCoords();
                }
                textbox.setCoords();
            }
            console.log(note.height);
            note.setCoords();

            canvas.renderAll();
        });

        // Handles the creation of notes
        socket.on('noteCreated', ({ note }) => {
            if(note) {
                addObjectToCanvas(canvas, boardId, "note", {
                    note
                });
            }
        });

        // Handles deleted noets // seems to be broken?
        socket.on('noteDeleted', ({ id }) => {
            const note = canvas.getObjects().find(obj => obj.id === id);
            if(note) {
                canvas.remove(note);
                canvas.renderAll();
            }
        });

    })
}