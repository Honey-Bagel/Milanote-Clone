
import { useAuthContext } from "../hooks/useAuthContext";

// components

const Home = () => {
	const { user } = useAuthContext();
	

	return (
		<div className="home">
			{user && (
				<div>user: {user.username} </div>
			)}
		</div>
	)
}


export default Home