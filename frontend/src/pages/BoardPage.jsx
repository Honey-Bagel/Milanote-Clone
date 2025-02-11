import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TestBoard from '../components/TestBoard';
import { useBoardsContext } from '../hooks/useBoardsContext';
import { fetchBoard } from '../services/boardAPI';
import socket from '../utils/socket';


const BoardPage = () => {
	const boardId = useParams().id
	const { dispatch } = useBoardsContext();
	const [error, setError] = useState(null);

	useEffect(() => {
		if(!boardId) {
			setError('Invalid Board id');
			return;
		}
		try {
			fetchBoard(boardId).then(() => {
				dispatch({ type: 'SET_BOARD', payload: boardId })

				socket.emit('joinBoard', {boardId});

			})
		} catch (error) {
			if(error.response && error.response.status === 403) {
				setError('Access denied');
			} else {
				setError('An error occurred' + error);
			}
		}

		return () => {
			socket.emit('leaveBoard', boardId);
		}
	}, [boardId])


	return (
		<div>
			{error && <div>{error}</div>}
			{!error && <TestBoard boardId={boardId} />}
		</div>
	)

};

export default BoardPage;