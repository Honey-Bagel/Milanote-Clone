import { useAuthContext } from '../hooks/useAuthContext';

const Profile = (props) => {
	const { user } = useAuthContext();



	return (
		<div>
			{user && (
				<div className="profile-settings">
					<h1>{user.username}</h1>
				</div>
			)}
		</div>
	);
}

export default Profile;