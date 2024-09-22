import { useAuthContext } from './useAuthContext';

export const useLogout = () => {
	const { dispatch } = useAuthContext();

	const logout = () => {
		// remove token from storage
		localStorage.removeItem('user');

		// dispatch logout action
		dispatch({type: 'LOGOUT'});
	}

	return { logout }
}