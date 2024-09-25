import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthContextProvider } from './context/AuthContext';
import { NotesContextProvider } from './context/NoteContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<AuthContextProvider>
			<NotesContextProvider>
				<App />
			</NotesContextProvider>
		</AuthContextProvider>
	</React.StrictMode>
)