import { BrowserRouter, Routes, Route} from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';

// pages and components
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Navbar from './components/Navbar';
import Sandbox from './pages/Sandbox';

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
						path='/login' element={<Login />}
						/>
						<Route
						path='/signup' element={<Signup />}
						/>
						<Route
						path='/sandbox' element={<Sandbox />}
						/>
					</Routes>
				</div>
			</BrowserRouter>
		</div>
	);
}

export default App;