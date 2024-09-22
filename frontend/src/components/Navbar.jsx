import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';
import { useAuthContext } from '../hooks/useAuthContext';

const Navbar = () => {
	const { user } = useAuthContext();
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

	// logout
	const handleLogout=()=> {
		logout();
		handleDropdownToggle();
	}

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
									<Link to="/sandbox" className="menu-item-link" onClick={handleDropdownToggle}>
										<b>Sandbox</b>
									</Link>
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