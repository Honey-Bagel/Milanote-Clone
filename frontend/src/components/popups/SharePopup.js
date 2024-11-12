// SharePopup.js
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { FiX } from 'react-icons/fi';
import { useAuthContext } from '../../hooks/useAuthContext';
import { updateBoard } from '../../services/boardAPI';
import { useBoardsContext } from '../../hooks/useBoardsContext';
import { fetchUserId } from '../../services/userAPI';

Modal.setAppElement('#root'); // Set the root for accessibility

function SharePopup({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [readOnlyLink, setReadOnlyLink] = useState('https://app.example.com/your-board');
  const [enableReadOnly, setEnableReadOnly] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { user } = useAuthContext();
  const { board } = useBoardsContext();


  const sendInvite = () => {
	if(!user || !email === '') return;

	fetchUserId(email).then((res) => {
		const { id } = res.data;
		if(!id) return;
		updateBoard(board, {
			$push: {
				collaborators: id
			}
		})
	})

	setEmail('');
  }



  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Share Popup"
      style={modalStyles}
    >
      <div style={headerStyle}>
        <h2>Share</h2>
        <button onClick={onClose} style={closeButtonStyle}><FiX size={24} /></button>
      </div>

      <div style={contentStyle}>
        <div style={sectionStyle}>
          <h3>Add editors</h3>
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <button onClick={sendInvite} style={inviteButtonStyle}>Send invite</button>

          <div style={inviteLinkContainerStyle}>
            <input type="text" value={readOnlyLink} readOnly style={linkInputStyle} />
            <button style={copyButtonStyle}>Copy link</button>
          </div>

          <label style={toggleLabelStyle}>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            Notify me when someone edits this board
          </label>
        </div>

        <div style={sectionStyle}>
          <h3>Share a read-only link</h3>
          <label style={toggleLabelStyle}>
            <input
              type="checkbox"
              checked={enableReadOnly}
              onChange={() => setEnableReadOnly(!enableReadOnly)}
            />
            Enable read-only link
          </label>

          {enableReadOnly && (
            <>
              <div style={inviteLinkContainerStyle}>
                <input type="text" value={readOnlyLink} readOnly style={linkInputStyle} />
                <button style={copyButtonStyle}>Copy link</button>
              </div>

              {/* Additional options */}
              <label style={toggleLabelStyle}>
                <input type="checkbox" />
                Allow comments, reactions & drawing
              </label>
              <label style={toggleLabelStyle}>
                <input type="checkbox" />
                Show download links on files
              </label>
              <label style={toggleLabelStyle}>
                <input type="checkbox" />
                Require a password
              </label>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Styles for modal and components
const modalStyles = {
  content: {
    width: '500px',
    margin: 'auto',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#333',
    color: 'white',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
};

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const sectionStyle = {
  backgroundColor: '#444',
  padding: '15px',
  borderRadius: '8px',
};

const inputStyle = {
  width: '100%',
  padding: '8px',
  marginBottom: '10px',
  borderRadius: '4px',
  border: '1px solid #555',
  color: 'white',
};

const inviteButtonStyle = {
  backgroundColor: '#FF5733',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
};

const inviteLinkContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '10px',
};

const linkInputStyle = {
  flexGrow: 1,
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #555',
};

const copyButtonStyle = {
  backgroundColor: '#FF5733',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
};

const toggleLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
};

export default SharePopup;