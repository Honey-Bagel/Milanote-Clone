
const ToolBar = ({ addNote }) => {

	return (
		<div id="toolbar" className="Toolbar">
			<button onClick={addNote}>Add Note</button>
		</div>
	)

}

export default ToolBar;