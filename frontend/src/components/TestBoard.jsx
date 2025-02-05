import React from 'react';
import { useCanvasInit } from '../hooks/canvasHooks/useCanvasInit';

const TestBoard = (board) => {
    const canvasRef = useCanvasInit('milanote-canvas', board.boardId);

    return (
        <div className="flex-1 relative">
            <canvas ref={canvasRef} className="border border-gray-300"></canvas>
        </div>
    )
}

export default TestBoard;