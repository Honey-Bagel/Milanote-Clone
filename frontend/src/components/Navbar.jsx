import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';
import { useAuthContext } from '../hooks/useAuthContext';
import axios from 'axios';

const Navbar = () => {
	const { user } = useAuthContext();
	const [rootBoard, setRootBoard] = useState(null);
	const { logout } = useLogout();

	const [dropdownToggle, setDropdownToggle] = useState(false);
	const dropdownRef = useRef(null);

	const handleDropdownToggle=()=>{
		setDropdownToggle(!dropdownToggle);
	}

	// detect outside click
	const handleClickOutside=(e)=> {
		if(dropdownRef.current&&!dropdownRef.current.contains(e.target)) {
			setDropdownToggle(false);
		}
	};

	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside);

		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Figure out how to fetch user's root board

	// logout
	const handleLogout=()=> {
		logout();
		handleDropdownToggle();
	}

	useEffect(() => {
		const fetchRootBoard = async () => {
			const response = await axios.post('/api/auth', {
				"token": user.token
			})

			const data = response.data;

			if(data.status == true) {
				setRootBoard(data.user.rootBoard);
			}
		}

		if(user) {
			fetchRootBoard();
		}

		return () => setRootBoard(null);
	}, [user]);

	return (
		<header>
			<div className="container">
			<Link to="/">
				<h1>Note App</h1>
			</Link>
			<nav>
				{user && (
					<div className="relative-div" ref={dropdownRef}>
						<button type="button" className="user-profile" onClick={handleDropdownToggle}>
							<b>{user.username}</b>
						</button>
						<div className={`profile-dropdown ${dropdownToggle ? "active":""}`}>
							<h3 className="menu-name">{user.username}</h3>
							<div className="menu-items-div">
							<div className="menu-item">
								{user && (
									<Link to={`/profile/${user.id}`} className="menu-item-link" onClick={handleDropdownToggle}>
									<b>Profile</b>
								</Link>
								)}
								</div>
								<div className="menu-item">
									{rootBoard && (
										<Link to={`/b/${rootBoard}`} className="menu-item-link" onClick={handleDropdownToggle}>
										<b>Sandbox</b>
									</Link>
								)}
								</div>
								<div className="border-top">
								<button
									type="button"
									className="menu-item logout"
									onClick={handleLogout}
									>
										<b>Logout</b>
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
				{!user && (
				<div>
					<Link to="/login">Login</Link>
					<Link to="/signup">Signup</Link>
				</div>
				)}
			</nav>
			</div>
		</header>
	)
}

export default Navbar