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
        <div className="flex h-screen">
            {/* Toolbar */ }
            <div id = "toolbar" className='w-20 bg-gray-800 text-white flex flex-col items-center p-4 space-y-4'>
                <button onClick={() => addObject("text")}>Add Note</button>
                <button onClick={() => addObject("board")}>Add Board</button>
            </div>
            { /* Canvas */ }
            <div className="flex-1 relative bg-gray-100">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    )
}

export default TestBoard;