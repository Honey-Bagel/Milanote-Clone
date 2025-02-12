import { Point } from "fabric";

const Toolbar = (canvasInstanceRef, lastPosX, lastPosY) => {

    const resetView = () => {
        canvasInstanceRef.current.absolutePan(new Point(0, 0));
        lastPosX.current = 0;
        lastPosY.current = 0;
        canvasInstanceRef.current.setZoom(1);
    }

    const onDragStart = (e, objectType) => {
        e.dataTransfer.setData('objectType', objectType);
    };

    return (
        <div id="toolbar" className='w-20 bg-gray-800 text-white flex flex-col items-center p-4 space-y-4'>
            {/* Draggable objects */}
            <div draggable="true" onDragStart={(e) => onDragStart(e, "text")}
                className="p-2 cursor-grab bg-gray-400 hover:bg-gray-300 rounded-md text-gray-100 text-center">
                    Add Note
            </div>
            <div draggable="true" onDragStart={(e) => onDragStart(e, "board")}
                className="p-2 cursor-grab bg-gray-400 hover:bg-gray-300 rounded-md text-gray-100 text-center">
                    Add Board
            </div>

            {/* Reset canvas view */}
            <button className="absolute bottom-2" onClick={() => resetView()}>Reset View</button>
        </div>
    )
}

export default Toolbar;