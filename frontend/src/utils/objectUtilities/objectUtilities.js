import { Note } from "../objects/noteObject";
import { Board } from "../objects/boardObject";

export const addNote = (boardId, options) => {
    return new Note({
        boardId,
        id: options._id,
        content: options.content,
        position: options.position,
        width: options.width,
        height: options.height,
        backgroundColor: options.color,
        textColor: options.textColor,
    });
};

export const addBoard = (boardId, options, navigate) => {
    return new Board({
        id: options._id,
        title: options.title,
        boardId: boardId,
        position: options.position,
        backgroundColor: options.color,
        navigate,
        root: false,
    })
}