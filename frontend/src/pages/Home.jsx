
import { useAuthContext } from "../hooks/useAuthContext";
import socket from '../utils/socket';

// components
import FabCanvas from "../components/FabCanvas";

const Home = () => {
	const { user } = useAuthContext();
	
	

	return (
		<div className="home">
			{user && (
				<div>user: {user.username} </div>
			)}
			<button onClick={(e) => {socket.emit('test', {'1': "one", '2': "two"})}}>Socket Testing!</button>
		</div>
	)
}


export default Home