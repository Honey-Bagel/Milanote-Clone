const User = require("../models/user");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcrypt");

module.exports.Signup = async (req, res, next) => {
	try {
		const { email, password, username, createdAt } = req.body;
		const existingUser = await User.findOne({ email });
		if(existingUser) {
			return res.json({ message: "User already exists"});
		}
		const user = await User.create({ email: email, password: password, username: username, createdAt: createdAt });
		const token = createSecretToken(user._id);
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

module.exports.Login = async (req, res, next) => {
	try { 
		const { email, password } = req.body;
		if(!email || !password) {
			return res.json({message: 'All fields are required'});
		}
		const user = await User.findOne({ email });
		if(!user) {
			return res.json({message: 'That email does not have a account'});
		}
		const auth = await bcrypt.compare(password, user.password);
		if(!auth) {
			return res.json({message: 'Incorrect password'});
		}
		const token = createSecretToken(user._id);
		const username = user.username;
		res.status(201).json({email, username, token });
		next()
	} catch (error) {
		res.status(400).json({error: error.message});
		console.log(error);
	}
}