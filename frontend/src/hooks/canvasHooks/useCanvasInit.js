import { useEffect, useRef } from 'react';
import { getNotes } from '../../services/notesAPI';
import { useNotesContext } from '../useNotesContext';
import { addNoteToCanvas } from '../../utils/canvasUtils';
import { addObjectToCanvas } from '../../utils/canvasUtils';
import * as fabric from 'fabric';

export const useCanvasInit = (canvasId, boardId) => {
    const { dispatch } = useNotesContext();
    const canvasRef = useRef(null);
    const canvasInstanceRef = useRef(null);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current);
        canvas.backgroundColor = "#222222";
        canvasInstanceRef.current = canvas;

        // Allows for canvas to change size when window changes size
        const resizeCanvas = () => {
            const container = canvas.getElement().parentElement;
            const { width, height } = container.getBoundingClientRect();
            canvas.setWidth(1300);
            canvas.setHeight(1100);
            canvas.renderAll();
        };

        window.addEventListener('resize', resizeCanvas());
        resizeCanvas();

        // Load notes from backend
        const loadNotes = async () => {
            try {
                getNotes(boardId).then((res) => {
                    if(res.data.status == false) {
                        dispatch({ type: 'SET_NOTES', payload: null });
                        return;
                    }
                    dispatch({ type: 'SET_NOTES', payload: res.data });
                    console.log(res.data);

                    res.data.forEach((note) => {
                        addObjectToCanvas(canvas, boardId, "note", note);
                    })
                })
            } catch (e) {
                console.log('Error: ' + e);
            }
        }

        loadNotes();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.dispose();
        };
    }, [boardId]);


    return { canvasRef, canvasInstanceRef };
}