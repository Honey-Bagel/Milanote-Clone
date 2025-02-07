import React from 'react';
import { useCanvasInit } from '../hooks/canvasHooks/useCanvasInit';
import { useCanvasSocketEvents } from '../hooks/canvasHooks/useCanvasSocketEvents';
import { useCanvasEventListeners } from '../hooks/canvasHooks/useCanvasEventListeners';
import { createObject } from '../services/objectAPI';
import { addBoard, addNote } from '../utils/objectUtilities/objectUtilities';

const TestBoard = (board) => {
    const { canvasRef, canvasInstanceRef } = useCanvasInit('milanote-canvas', board.boardId);

    useCanvasSocketEvents(board.boardId, canvasInstanceRef);
    useCanvasEventListeners(board.boardId, canvasInstanceRef);

    const addObject = (type) => {
        console.log('adding note');

        if(!canvasRef) return;

        try{
            createObject(board.boardId, {
                title: "Note",
                content: "New Note",
                type,
                position: {
                    x: 10,
                    y: 10,
                },
                width: 200,
                height: 50,
                board: board.boardId,
            }).then((res) => {
                const { position, content, width, height, type, _id, board } = res.data;
                switch(type) {
                    case "text":
                        canvasInstanceRef.current.add(addNote(board, res.data));
                        break;
                    default:
                        console.log("type error");
                        break;
                }
            })
        } catch (e) {
            console.log(e);
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