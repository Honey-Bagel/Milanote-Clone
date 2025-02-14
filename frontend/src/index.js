import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthContextProvider } from './context/AuthContext';
import { NotesContextProvider } from './context/NoteContext';
import { BreadcrumbProvider } from './context/BreadcrumbContext';
import { ActiveObjectProvider } from './hooks/useActiveObject';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<AuthContextProvider>
			<NotesContextProvider>
                <ActiveObjectProvider>
                    <BreadcrumbProvider>
                        <App />
                    </BreadcrumbProvider>
                </ActiveObjectProvider>
			</NotesContextProvider>
		</AuthContextProvider>
	</React.StrictMode>
)