const User = require("../models/user");
const Board = require("../models/board");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcrypt");

// Handle user signup (email, password, username)
module.exports.Signup = async (req, res, next) => {
	try {
		const { email, password, username } = req.body;
		const existingUser = await User.findOne({ email });
		const rootBoard = new Board({title: "root board", root: true });
		await rootBoard.save();

		if(existingUser) return res.json({ message: "User already exists"});

		const user = await User.create({ email: email, password: password, username: username, rootBoard: rootBoard });

		// create secret token for user
		const token = createSecretToken(user._id);

		// create cookie token to keep user signed in
		res.cookie("token", token, {
			withCredentials: true,
			httpOnly: false,
		});
		res.status(201).json({ email, username, token });
		next();
	} catch (error) {
		res.status(400).json({error: error.message});
		console.error(error);
	}
}

// Handle user login ( email, password)
module.exports.Login = async (req, res, next) => {
	try { 
		const { email, password } = req.body;
		
		// check to see if method was provided an email and password
		if(!email || !password) {
			return res.json({message: 'All fields are required'});
		}

		const user = await User.findOne({ email });

		// Confirm user is valid
		if(!user) {
			return res.json({message: 'That email does not have a account'});
		}
		
		// Confirm password is valid
		const auth = await bcrypt.compare(password, user.password);
		// if(!auth) {
		// 	return res.json({message: 'Incorrect password'});
		// }
		
		const token = createSecretToken(user._id);
		const username = user.username;
		const id = user._id;
		const rootBoard = user.rootBoard;
		res.status(201).json({email, username, token, id, rootBoard });
		next()
	} catch (error) {
		res.status(400).json({error: error.message});
		console.log(error);
	}
}

module.exports.fetchUserId = async (req, res) => {
	const { email } = req.body;

	if(!email) {
		return res.status(404).json({ message: "No email entered"});
	}

	const user = await User.findOne({ email });

	if(!user) {
		return res.status(404).json({message: "Email was not a valid user" });
	}

	const id = user._id;

	res.status(200).json({ id });
}