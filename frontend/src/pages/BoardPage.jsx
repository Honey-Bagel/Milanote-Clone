import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Board from "../components/Board";
import { useBoardsContext } from '../hooks/useBoardsContext';
import { fetchBoard } from '../services/boardAPI';


const BoardPage = () => {
	const boardId = useParams().id
	const { board, dispatch } = useBoardsContext();
	const [error, setError] = useState(null);

	useEffect(() => {
		if(!boardId) {
			setError('Invalid Board id');
			return;
		}
		try {
			fetchBoard(boardId).then(() => {
				dispatch({ type: 'SET_BOARD', payload: boardId })
			})
		} catch (error) {
			if(error.response && error.response.status === 403) {
				setError('Access denied');
			} else {
				setError('An error occurred' + error);
			}
		}
	}, [boardId])


	return (
		<div>
			{error && <div>{error}</div>}
			{!error && <Board boardId={boardId} />}
		</div>
	)

};

export default BoardPage;