import { useEffect, useRef } from 'react';
import { getObjects } from '../../services/objectAPI';
import { getItems } from '../../services/itemAPI';
import { useNotesContext } from '../useNotesContext';
import { addObjectToCanvas } from '../../utils/canvasUtils';
import { useNavigate } from 'react-router-dom';
import { fetchBoard } from '../../services/boardAPI';
import * as fabric from 'fabric';

export const useCanvasInit = (canvasId, boardId) => {
    const { dispatch } = useNotesContext();
    const canvasRef = useRef(null);
    const canvasInstanceRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current);
        canvas.backgroundColor = "#222222";
        canvasInstanceRef.current = canvas;
        canvasInstanceRef.current.left = 0;
        canvasInstanceRef.current.right = 0;
        canvasInstanceRef.current.top = 0;
        canvasInstanceRef.current.bottom = 0;

        // Allows for canvas to change size when window changes size
        const resizeCanvas = () => {
            const container = canvas.getElement().parentElement;
            const { width, height } = container.getBoundingClientRect();
            canvas.setWidth(1300);
            canvas.setHeight(1100);
            canvas.renderAll();
        };

        const constructBoardStack = async () => {
            console.log('making board stack');
            const history = await getParentBoard(boardId);
            canvasInstanceRef.current.history = history;
        }

        const getParentBoard = async (boardId) => {
            const response = await fetchBoard(boardId);
            const newBoard = response.data;
            if(newBoard.root) {
                return [boardId];
            } else {
                const parentHist = await getParentBoard(newBoard.board);
                return [boardId].concat(parentHist);
            }
        }
        constructBoardStack();

        window.addEventListener('resize', resizeCanvas());

        resizeCanvas();

        // Load notes from backend
        const loadNotes = async () => {
            try {
                getItems(boardId).then((res) => {
                    if(res.data.status == false) {
                        dispatch({ type: 'SET_ITEMS', payload: null });
                        return;
                    }
                    dispatch({ type: 'SET_ITEMS', payload: res.data });
                    console.log(res.data);

                    res.data.forEach((note) => {
                        addObjectToCanvas(canvas, boardId, note.type, note, navigate);
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