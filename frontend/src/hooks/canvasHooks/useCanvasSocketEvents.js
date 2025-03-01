import { useNavigate } from 'react-router-dom';
import { addObjectToCanvas } from '../../utils/canvasUtils';
import socket from '../../utils/socket';
import { useEffect } from 'react';
import { useBreadcrumb } from '../../context/BreadcrumbContext';

export const useCanvasSocketEvents = (boardId, canvasRef) => {
    const navigate = useNavigate();
    const { openBoard } = useBreadcrumb();

    useEffect(() => {
        const canvas = canvasRef.current;
        if(!socket || !canvas) return; 

        // Handles when objects are updated
        socket.on('itemUpdated', ({ id, updates }) => {
            const object = canvas.getObjects().find(obj => obj.id === id);
            if(!object) return;
            console.log(updates);
            if(updates.position || updates.width && updates.height) {
                console.log('pos', updates);
                object.set({
                    top: updates.position.y,
                    left: updates.position.x,
                    scaleX: updates.scale ? updates.scale.x : 1,
                    scaleY: updates.scale ? updates.scale.y : 1,
                });
                object.setCoords();
            }

            if(updates.content) {
                object.textbox.set({ text: updates.content });
            }

            canvas.renderAll();
        });

        // Handles the creation of notes
        socket.on('itemCreated', ({ item }) => {
            if(item) {
                addObjectToCanvas(canvas, boardId, item.type, {
                    item
                },
                navigate,
                openBoard
            );
            }
        });

        // Handles deleted noets // seems to be broken?
        socket.on('itemDeleted', ({ id }) => {
            const item = canvas.getObjects().find(obj => obj.id === id);
            if(item) {
                canvas.remove(item);
                canvas.renderAll();
            }
        });

    })
}