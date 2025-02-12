import React, { useEffect } from 'react';
import { useCanvasInit } from '../hooks/canvasHooks/useCanvasInit';
import { useCanvasSocketEvents } from '../hooks/canvasHooks/useCanvasSocketEvents';
import { useCanvasEventListeners } from '../hooks/canvasHooks/useCanvasEventListeners';
import { useNavigate } from 'react-router-dom';
import { Point } from 'fabric';
import { useBreadcrumb } from '../context/BreadcrumbContext';
import { fetchBoard } from '../services/boardAPI';

/* Components */
import Toolbar from './Toolbar';
import Topbar from './Topbar';

const TestBoard = (board) => {
    const { canvasRef, canvasInstanceRef } = useCanvasInit('milanote-canvas', board.boardId);
    const { setBreadcrumbPath } = useBreadcrumb();

    useCanvasSocketEvents(board.boardId, canvasInstanceRef);
    const { lastPosX, lastPosY } = useCanvasEventListeners(board.boardId, canvasInstanceRef);

    useEffect(() => {
        if(!board) return;

        const buildBreadcrumbPath = async (board) => {
            let path = [];
            while(board) {
                try {
                    const response = await fetchBoard(board);
                    if(!response) return;
                    board = response.data;

                    path.unshift({ id: board._id, name: board.title });
                    board = board.board;
                } catch (e) {
                    console.log(e);
                }
            }
            return path;
        }
        const getPath = async (boardId) => {
            const path = await buildBreadcrumbPath(boardId);

            setBreadcrumbPath(path);
        }

        getPath(board.boardId);
    }, [board])

    return (
        <div className="flex h-screen flex-col">
            { /* Top bar */}
            <Topbar />
            <div className="flex h-screen">
                {/* Toolbar */ }
                <Toolbar canvasInstanceRef={canvasInstanceRef} lastPosX={lastPosX} lastPosY={lastPosY}/>
                { /* Canvas */ }
                <div id="canvas-container" className="flex-1 relative bg-gray-100">
                    <canvas id="fab-canvas" ref={canvasRef}></canvas>
                </div>
            </div>
        </div>
        
    )
}

export default TestBoard;