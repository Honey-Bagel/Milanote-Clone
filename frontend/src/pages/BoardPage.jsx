import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Board from "../components/Board";
import { useBoardsContext } from '../hooks/useBoardsContext';


const BoardPage = () => {
	const boardId = useParams().id
	const { board, dispatch } = useBoardsContext();

	useEffect(() => {
		if(!boardId) return;
		
		dispatch({ type: 'SET_BOARD', payload: boardId })
	}, [boardId])


	return (
		<div>
			<Board boardId={boardId} />
		</div>
	)

};

export default BoardPage;