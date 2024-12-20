import { FiSettings } from 'react-icons/fi'
import React, { useState } from 'react';
import SharePopup from './popups/SharePopup';
import { useBoardsContext } from '../hooks/useBoardsContext';


const BoardNavBar = () => {
	const [showSettings, setShowSettings] = useState(false);
	const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
	const { board } = useBoardsContext();

	const toggleSettings = () => {
		setShowSettings((prev) => !prev);
	}

	const shareWith = () => {
		setIsSharePopupOpen(true);
	}

	return (
		<div className="navbar-board">
			<header>
				<div>
					<button className="setting-cog" onClick={toggleSettings}>
						<FiSettings size={20} /> {/* Settings icon */}
					</button>
					{showSettings && (
						<div className="setting-menu">
							<button onClick={shareWith}>
								Share
							</button>
						</div>
					)}
				</div>
			</header>
			<SharePopup isOpen={isSharePopupOpen} onClose={() => setIsSharePopupOpen(false)} />
		</div>
	)
}

const buttonStyle = {
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
}

const settingsMenuStyle = {
	position: 'absolute',
	top: '100%',
	right: 0,
	backgroundColor: 'gray',
	boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
	borderRadius: '4px',
	padding: '8px',
	zIndex: 1,
}

export default BoardNavBar;