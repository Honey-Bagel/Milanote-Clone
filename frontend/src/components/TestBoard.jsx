import React from 'react';
import { useCanvasInit } from '../hooks/canvasHooks/useCanvasInit';
import { useCanvasSocketEvents } from '../hooks/canvasHooks/useCanvasSocketEvents';
import { useCanvasEventListeners } from '../hooks/canvasHooks/useCanvasEventListeners';
import { createObject } from '../services/objectAPI';
import { createNote } from '../utils/objects/noteObject';
import { useAuthContext } from '../hooks/useAuthContext';
import { createBoard } from '../utils/objects/boardObject';

const TestBoard = (board) => {
    const { canvasRef, canvasInstanceRef } = useCanvasInit('milanote-canvas', board.boardId);
    const { user } = useAuthContext();

    useCanvasSocketEvents(board.boardId, canvasInstanceRef);
    useCanvasEventListeners(board.boardId, canvasInstanceRef);

    const addObject = (type) => {
        console.log('adding note');

        if(!canvasRef) return;

        switch(type) {
            case "text":
                createNote(canvasInstanceRef, board.boardId);
                break;
            case "board":
                createBoard(canvasInstanceRef, board.boardId, user.id);
                break;
        }
        

        // const note = new Note({
        //     left: 10,
        //     top: 10,
        //     width: 200,
        //     height: 50,
        //     text: "New note",
        // });
        // canvasInstanceRef.current.add(note);
    }

    return (
        <div className="flex-1 relative">
            <button onClick={() => addObject("text")}>Add note</button>
            <button onClick={() => addObject("board")}>Add Board</button>
            <canvas ref={canvasRef} className="border border-gray-300"></canvas>
        </div>
    )
}

export default TestBoard;