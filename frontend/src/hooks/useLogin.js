import { useState } from 'react';
import { useAuthContext } from './useAuthContext';
import axios from 'axios';

export const useLogin = () => {
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(null);
	const { dispatch } = useAuthContext();

	const login = async (email, password) => {
		setIsLoading(true);
		setError(true);
		
		const response = await axios.post('/api/auth/login', {email, password});
		
		const data = response.data;

		if(!response.status != "201") {
			setIsLoading(false);
			setError(response.error);
		}
		if(response.status == "201") {
			// save user to local storage
			localStorage.setItem('user', JSON.stringify(data)); 

			// update the auth context
			dispatch({type: 'LOGIN', payload: data});

			setIsLoading(false);
		}
	}

	return { login, isLoading, error }
}