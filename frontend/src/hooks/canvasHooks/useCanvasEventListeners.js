import { useEffect, useRef } from 'react';
import { Point } from 'fabric';
import { deleteItem } from '../../services/itemAPI';

export const useCanvasEventListeners = (boardId, canvasInstanceRef) => {
    const EXPAND_THRESHOLD = 100;
    const EXPAND_AMOUNT = 500; // make a constant file for these
    const isPanning = useRef(false);
    const lastPosX = useRef(0);
    const lastPosY = useRef(0);

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
        };

        // Sets the size of the canvas
        const resizeCanvas = () => {
            const navbar = document.getElementById('navbar');
            const toolbar = document.getElementById('toolbar');
            const topbar = document.getElementById('topbar');

            const navbarHeight = navbar ? navbar.offsetHeight : 0;
            const toolbarWidth = toolbar ? toolbar.offsetWidth : 0;
            const topbarHeight = topbar ? topbar.offsetHeight : 0;

            const availableHeight = window.innerHeight - navbarHeight - topbarHeight;
            const availableWidth = window.innerWidth - toolbarWidth;

            console.log("height: " + window.innerHeight + " - available height: " + availableHeight )

            canvasInstance.setWidth(availableWidth);
            canvasInstance.setHeight(availableHeight);
            canvasInstance.renderAll();
        };

        const handleZoom = (event) => {
            let delta = event.e.deltaY;
            let zoom = canvasInstance.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.01) zoom = 0.01;
            canvasInstance.zoomToPoint({ x: event.e.offsetX, y: event.e.offsetY }, zoom);
            event.e.preventDefault();
            event.e.stopPropagation();
        }

        resizeCanvas();

        canvasInstance.on('selection:created', (event) => {
            if(event.selected[0].group) {
                event.selected[0].group.set({
                    hasBorders: false,
                    hasControls: false,
                    selectable: false,
                });
            }
        });

        // Handles panning the canvas
        canvasInstance.on('mouse:down', (event) => {
            if(event.e.shiftKey) {
                if(!isPanning.current) {
                    isPanning.current = true;
                    lastPosX.current = event.e.clientX;
                    lastPosY.current = event.e.clientY;
                    canvasInstance.selection = false;
                    canvasInstance.setCursor('grab');
                }
            }
            
        });

        canvasInstance.on('mouse:move', (event) => {
            if(isPanning.current) {
                const width = canvasInstance.width;
                const height = canvasInstance.height;
                const deltaX = event.e.clientX - lastPosX.current;
				const deltaY = event.e.clientY - lastPosY.current;

                const panX = canvasInstance.viewportTransform[4];
                const panY = canvasInstance.viewportTransform[5];
				canvasInstance.relativePan(new Point(deltaX, deltaY)); // Pan the canvas
				lastPosX.current = event.e.clientX;
				lastPosY.current = event.e.clientY;
                canvasInstance.setCursor('grab');
            }
        });

        canvasInstance.on('mouse:up', () => {
            if(isPanning.current) {
                isPanning.current = false;
                canvasInstance.setCursor('default');
                canvasInstance.selection = true;
            }
        })
    
        canvasInstance.on('object:modified', (e) => {
            checkCanvasEdges(e.target);
        })
    
        canvasInstance.on('object:added', (e) => {
            checkCanvasEdges(e.target);
        })
        
        canvasInstance.on('mouse:wheel', (e) => {
            handleZoom(e);
        })

        // Handle keyboard backspace/delete event to delete notes
            
        const handleKeyDown = (event) => {
            if(canvasInstance.getActiveObject() && !canvasInstance.getActiveObject().type) {
                return;
            }
            if((event.key === 'Delete' || event.key === 'Backspace') && canvasInstance.getActiveObjects().length >= 1) {
                canvasInstance.getActiveObjects().forEach((obj) => {
                const activeObject = obj;
                if(activeObject.id) {
                    try {
                        canvasInstance.discardActiveObject();
                        canvasInstance.remove(activeObject);
                        deleteItem(activeObject.id, boardId).then((res) => {
                            if(res.status >= 200 && res.status < 300) {
                                console.log('confirm delete');
                            } else {
                                console.log('reject delete');
                                canvasInstance.add(activeObject);
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

        window.addEventListener('resize', resizeCanvas);
        // end keyboard listener

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', resizeCanvas);
        }

    }, [canvasInstanceRef, boardId]);

    return { lastPosX, lastPosY };
}