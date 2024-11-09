import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';
import React, { useEffect } from 'react';
import socket from './utils/socket';

// pages and components
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import BoardPage from './pages/BoardPage';


function App() {
	const { user } = useAuthContext();

	useEffect(() => {
		socket.on('test', (data) => {
			console.log('test completed:', data);
		});

		return () => {
			socket.off('test');
		};
	}, []);
	
	return (
		<div className="App">
			<BrowserRouter>
				<Navbar />
				<div className='pages'>
					<Routes>
						<Route
						path='/'
						element={<Home />}
						/>
						<Route
						path='/login' element={!user ? <Login /> : <Navigate to="/"/>}
						/>
						<Route
						path='/signup' element={!user ? <Signup /> : <Navigate to="/"/>}
						/>
						<Route
						path='/profile/:id' element={<Profile />}
						/>
						<Route
						path='/board' element={<BoardPage />}
						/>
					</Routes>
				</div>
			</BrowserRouter>
		</div>
	);
}

export default App;