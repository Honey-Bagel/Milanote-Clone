import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
	const [boards, setBoards] = useState([]);
	useEffect(() => {
	  // Fetch data from the Express server
	  axios.get('http://localhost:3000/api/boards/')
		.then(response => setBoards(response.data))
		.catch(error => console.error(error));
	}, []);
	return (
	  <div>
		<h1>MERN Stack Milanote App</h1>
		<ul>
		  {boards.map(board => (
			<li key={board._id}>{board.name}</li>
		  ))}
		</ul>
	  </div>
	);
  };
  export default App;