import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';

const Login = () => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const { login, error, isLoading } = useLogin();

	const handleSubmit = async (e) => {
		e.preventDefault()

        console.log('login')
		try {
			await login(email, password);
		} catch (e) { console.log(e); }
	}

	const forgotPassword = async (e) => {
		e.preventDefault()

		
	}

	return (
		<div>
		<form className='login' onSubmit={handleSubmit}>
			<h3>Login</h3>

			<label>Email:</label>
			<input 
				type="email"
				onChange={(e) => setEmail(e.target.value)}
				value={email}
			/>
			<label>Password:</label>
			<input 
				type="password"
				onChange={(e) => setPassword(e.target.value)}
				value={password}
			/>

			<button>Login</button>
		</form>
		<button onSubmit={forgotPassword}>Forgot Password</button>
		</div>
	)
}

export default Login