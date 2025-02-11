import React, { useEffect } from 'react';
import { useCanvasInit } from '../hooks/canvasHooks/useCanvasInit';
import { useCanvasSocketEvents } from '../hooks/canvasHooks/useCanvasSocketEvents';
import { useCanvasEventListeners } from '../hooks/canvasHooks/useCanvasEventListeners';
import { useNavigate } from 'react-router-dom';
import { Point } from 'fabric';
import { useBreadcrumb } from '../context/BreadcrumbContext';
import { fetchBoard } from '../services/boardAPI';

const TestBoard = (board) => {
    const { canvasRef, canvasInstanceRef } = useCanvasInit('milanote-canvas', board.boardId);
    const { breadcrumbPath, goToBoard, setBreadcrumbPath } = useBreadcrumb();
    const navigate = useNavigate();

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

    const resetPan = () => {
        canvasInstanceRef.current.absolutePan(new Point(0, 0));
        lastPosX.current = 0;
        lastPosY.current = 0;
        canvasInstanceRef.current.setZoom(1);
    }
    
    const onDragStart = (e, objectType) => {
        e.dataTransfer.setData('objectType', objectType);
    };

    const goToABoard = (board) => {
        navigate(`/board/${board.id}`);
        goToBoard(board);
    }

    

    return (
        <div className="flex h-screen flex-col">
            { /* Top bar */}
            <div id="topbar" className="h-10 bg-gray-900 text-white flex flex-1 items-center p-4">
                {breadcrumbPath.map((board, index) => (
                    <React.Fragment key={board.id}>
                        <button className="text-blue-500 hover:underline" onClick={() => goToABoard(board)}>
                            {board.name}
                        </button>
                        { index < breadcrumbPath.length - 1 && <span>/</span>}
                    </React.Fragment>
                ))}
            </div>
            <div className="flex h-screen">
                {/* Toolbar */ }
                <div id = "toolbar" className='w-20 bg-gray-800 text-white flex flex-col items-center p-4 space-y-4'>
                    <div draggable="true" onDragStart={(e) => onDragStart(e, "text")}
                        className="p-2 cursor-grab bg-gray-400 hover:bg-gray-300 rounded-md text-gray-100 text-center"
                    >Add Note</div>
                    <div draggable="true" onDragStart={(e) => onDragStart(e, "board")}
                        className="p-2 cursor-grab bg-gray-400 hover:bg-gray-300 rounded-md text-gray-100 text-center"
                    >Add Board</div>
                    <button className="absolute bottom-2" onClick={() => resetPan()}>Reset View</button>
                </div>
                { /* Canvas */ }
                <div id="canvas-container" className="flex-1 relative bg-gray-100">
                    <canvas id="fab-canvas" ref={canvasRef}></canvas>
                </div>
            </div>
        </div>
        
    )
}

export default TestBoard;