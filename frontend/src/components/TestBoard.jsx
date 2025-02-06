import React from 'react';
import { useCanvasInit } from '../hooks/canvasHooks/useCanvasInit';
import { useCanvasSocketEvents } from '../hooks/canvasHooks/useCanvasSocketEvents';
import { useCanvasEventListeners } from '../hooks/canvasHooks/useCanvasEventListeners';

const TestBoard = (board) => {
    const { canvasRef, canvasInstanceRef } = useCanvasInit('milanote-canvas', board.boardId);

    useCanvasSocketEvents(board.boardId, canvasInstanceRef);
    useCanvasEventListeners(board.boardId, canvasInstanceRef)

    return (
        <div className="flex-1 relative">
            <canvas ref={canvasRef} className="border border-gray-300"></canvas>
        </div>
    )
}

export default TestBoard;