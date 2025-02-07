
const ToolBar = ({addNote, addBoard}) => {

	return (
		<div id="toolbar" className="Toolbar">
			<button onClick={addNote}>Add Note</button>
			<button onClick={addBoard}>Add Board</button>
		</div>
	)
	// return (
	// 	<div id="toolbar" className="Toolbar">
	// 		<div id="note-tb" class="draggable-note" draggable="true">Note</div>
	// 	</div>
	// )

}

export default ToolBar;