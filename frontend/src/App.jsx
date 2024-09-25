import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';

// pages and components
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Navbar from './components/Navbar';
import Sandbox from './pages/Sandbox';
import Profile from './pages/Profile';

function App() {
	const { user } = useAuthContext();
	
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
						path='/sandbox' element={user ? <Sandbox /> : <Navigate to="/"/>}
						/>
						<Route
						path='/profile/:id' element={<Profile />}
						/>
					</Routes>
				</div>
			</BrowserRouter>
		</div>
	);
}

export default App;