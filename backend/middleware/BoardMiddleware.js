const Board = require('../models/board');

module.exports.checkBoardAccess = async (req, res, next) => {
	const { boardId } = req.params;
	const userId = req.user.id;

	try {
		const board = await Board.findById(boardId);

		if(!board) {
			return res.status(404).json({ message: 'Board not found' });
		}

		// Check owner or permissions
		if(board.owner === userId || board.collaborators.includes(userId)) {
			req.board = board;
			next();
		} else {
			return res.status(403).json({ message: 'Access denied.'});
		}
	} catch (e) {
		return res.status(500).json({ message: 'Server error.' });
	}
}