import { useState } from 'react';
import { useAuthContext } from './useAuthContext';
import axios from 'axios';

export const useSignup = () => {
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(null);
	const { dispatch } = useAuthContext();

	const signup = async (email, username, password) => {
		setIsLoading(true);
		setError(null);

		const response = await axios.post('/api/auth/signup', {email: email, username: username, password: password});
		const json = await response.json();

		if(!response.ok) {
			setIsLoading(false);
			setError(json.error);
		}
		if(response.ok) {
			// save the user to local storage
			localStorage.setItem('user', JSON.stringify(json));

			// update the auth context
			dispatch({type: 'LOGIN', payload: json});

			setIsLoading(false);
		}
	}

	return { signup, isLoading, error }
}