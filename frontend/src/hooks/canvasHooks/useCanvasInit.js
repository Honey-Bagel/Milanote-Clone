import { useEffect, useRef } from 'react';
import { getItems } from '../../services/itemAPI';
import { useNotesContext } from '../useNotesContext';
import { addObjectToCanvas } from '../../utils/canvasUtils';
import { useNavigate } from 'react-router-dom';
import * as fabric from 'fabric';
import { useBreadcrumb } from '../../context/BreadcrumbContext';

export const useCanvasInit = (canvasId, boardId) => {
    const { dispatch } = useNotesContext();
    const canvasRef = useRef(null);
    const canvasInstanceRef = useRef(null);
    const navigate = useNavigate();
    const { openBoard } = useBreadcrumb();

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current);
        canvas.backgroundColor = "#222222";
        canvasInstanceRef.current = canvas;
        canvasInstanceRef.current.left = 0;
        canvasInstanceRef.current.right = 0;
        canvasInstanceRef.current.top = 0;
        canvasInstanceRef.current.bottom = 0;

        // Load notes from backend
        const loadNotes = async () => {
            try {
                getItems(boardId).then((res) => {
                    if(res.data.status == false) {
                        dispatch({ type: 'SET_ITEMS', payload: null });
                        return;
                    }
                    dispatch({ type: 'SET_ITEMS', payload: res.data });
                    console.log('res data', res.data);

                    res.data.forEach((item) => {
                        addObjectToCanvas(canvas, boardId, item.type, item, navigate, openBoard);
                    })
                })
            } catch (e) {
                console.log('Error: ' + e);
            }
        }

        loadNotes();

        return () => {
            canvas.dispose();
        };
    }, [boardId]);


    return { canvasRef, canvasInstanceRef };
}