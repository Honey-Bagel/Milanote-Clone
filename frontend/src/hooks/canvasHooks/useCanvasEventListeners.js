import * as fabric from 'fabric';
import { useEffect } from 'react';
import { deleteNote } from '../../services/notesAPI';

export const useCanvasEventListeners = (boardId, canvasInstanceRef) => {
    const EXPAND_THRESHOLD = 100;
  const EXPAND_AMOUNT = 500; // make a constant file for these

    useEffect(() => {
        const canvasInstance = canvasInstanceRef.current;
        let viewportWidth = canvasInstance.getWidth();
	let viewportHeight = canvasInstance.getHeight();
        if(!canvasInstance) return;
        
        canvasInstance.on('mouse:wheel', (event) => {
            event.e.preventDefault();
            event.e.stopPropagation();
            let deltaX = 0;
            let deltaY = 0;
            if(event.e.shiftKey) {
                deltaX = event.e.deltaY > 0 ? 1 : -1;
            } else {
                deltaY = event.e.deltaY > 0 ? 1 : -1;
            }
            const panX = canvasInstance.viewportTransform[4];
            const panY = canvasInstance.viewportTransform[5];

            if(canvasInstance.getWidth() - panX + (deltaX * 30) <= viewportWidth && ((deltaX * 30) - panX) > 0) {
                canvasInstance.relativePan({ x: -deltaX * 30, y: 0 });
            }
            if(canvasInstance.getHeight() - panY + (deltaY * 30) <= viewportHeight && ((deltaY * 30) - panY) >= 0) {
                canvasInstance.relativePan({ x: 0, y: -deltaY * 30});
            }
        });

        canvasInstance.on('selection:created', (event) => {
            applyCustomBorders(event.selected);
            
            event.selected[0].group.set({
                hasBorders: false,
                hasControls: false
            });
        });

        canvasInstance.on('selection:updated', (event) => {
            applyCustomBorders(event.selected);
        });

        canvasInstance.on('selection:cleared', () => {
            removeCustomBorders();
        });

        canvasInstance.on('object:moving', (event) => {
            moveCustomBorders(canvasInstance.getActiveObjects());
        });

        const applyCustomBorders = (objects) => {
            removeCustomBorders();

            objects = Array.isArray(objects) ? objects : [objects];

            objects.forEach(obj => {
                const { left, top } = obj.getBoundingRect();
                if(!obj._customBorder) {
                    obj._customBorder = new fabric.Rect({
                        left: left - 2,
                        top: top - 2,
                        width: obj.width,
                        height: obj.height,
                        rx: 10,
                        ry: 10,
                        stroke: 'grey',
                        strokeWidth: 4,
                        fill: 'transparent',
                        selectable: false,
                        evented: false,
                    });
                }
                canvasInstance.add(obj._customBorder);
            });
            canvasInstance.renderAll();
        }

        const removeCustomBorders = () => {
            canvasInstance.getObjects().forEach((obj) => {
                if(obj._customBorder) {
                    canvasInstance.remove(obj._customBorder);
                    obj._customBorder = null;
                }
            });
            canvasInstance.renderAll();
        }

        const moveCustomBorders = (target) => {
            if(!target) return;

            let objects = target;

            objects = Array.isArray(objects) ? objects : [objects];

            objects.forEach(obj => {
                const { left, top } = obj.getBoundingRect();
                if(obj._customBorder) {
                    obj._customBorder.set({
                        left: left - 2,
                        top: top -2
                    });
                }
            });
            canvasInstance.renderAll();
        }

        const checkCanvasEdges = (object) => {
            let newViewportHeight = canvasInstance.height;
            let newViewportWidth = canvasInstance.width;
    
            const objectRight = object.left + object.width * object.scaleX;
            const objectBottom = object.top + object.height * object.scaleY;
    
            const panY = canvasInstance.viewportTransform[5];
            console.log(newViewportHeight + panY - EXPAND_THRESHOLD, newViewportHeight - EXPAND_AMOUNT + panY)
    
            if (objectRight > newViewportWidth - EXPAND_THRESHOLD) {
                newViewportWidth += objectRight + EXPAND_AMOUNT;
            } else {
                newViewportWidth = 1300;
            }
          
            if (objectBottom > newViewportHeight - EXPAND_THRESHOLD) {
                newViewportHeight = objectBottom + EXPAND_AMOUNT;
            } else {
                newViewportHeight = 1100;
            } 
    
            if(viewportHeight < newViewportHeight) {
                viewportHeight = newViewportHeight;
            }
            if(viewportWidth < newViewportWidth) {
                viewportWidth = newViewportWidth;
            }
            
            canvasInstance.renderAll();
        }
    
        canvasInstance.on('object:modified', (e) => {
            checkCanvasEdges(e.target);
        })
    
        canvasInstance.on('object:added', (e) => {
            checkCanvasEdges(e.target);
        })

        // Handle keyboard backspace/delete event to delete notes
            
        const handleKeyDown = (event) => {
            if(canvasInstance.getActiveObject() && canvasInstance.getActiveObject().type && canvasInstance.getActiveObject().type === 'textbox') {
                return;
            }
            if((event.key === 'Delete' || event.key === 'Backspace') && canvasInstance.getActiveObjects().length >= 1) {
                canvasInstance.getActiveObjects().forEach((obj) => {
                const activeObject = obj;
                if(activeObject.id) {
                    try {
                        deleteNote(activeObject.id, boardId).then((res) => {
                            if(res.status >= 200 && res.status < 300) {
                                canvasInstance.remove(activeObject);
                            }
                        }).catch(console.error);
                    } catch (error) {
        
                    }	
                };
                });
                canvasInstance.renderAll();
                canvasInstance.discardActiveObject();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        // end keyboard listener

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }

    })
}