import { Point } from "fabric";
import { useActiveObject } from "../hooks/useActiveObject";
import { motion, AnimatePresence } from "framer-motion";

const Toolbar = (props) => {
    const { canvasInstanceRef, lastPosX, lastPosY } = props.props;
    const { activeObject } = useActiveObject();
    

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

    // return (
    //     <div id="toolbar" className="relative w-20 bg-gray-800 text-white flex flex-col items-center p-4 space-y-4">
    //             <AnimatePresence mode="wait">
    //                 {activeObject ? (
    //                     <motion.div
    //                         key="customize"
    //                         initial={{ x: "100%" }}
    //                         animate={{ x: 0 }}
    //                         exit={{ x: "100%" }}
    //                         transition={{ duration: 0.1, ease: "easeInOut" }}
    //                         className="absolute top-0 left-0 w-full h-full"
    //                     >
    //                         <h2 className="text-lg font-bold">Customize Object</h2>
    //                         { /* Add customization options */ }
    //                     </motion.div>
    //                 ) : (
    //                     <motion.div
    //                         key="add-items"
    //                         initial={{ x: "-100%" }}
    //                         animate={{ x: 0 }}
    //                         exit={{ x: "-100%" }}
    //                         transition={{ duration: 0.1, ease: "easeInOut" }}
    //                         className="absolute top-0 left-0"
    //                     >
    //                         <h2 className="text-lg font-bold">Add Items</h2>
    //                         { /* Draggable Objects */ }
    //                         <div draggable="true" onDragStart={(e) => onDragStart(e, "text")}
    //                             className="p-2 cursor-grab bg-gray-400 hover:bg-gray-300 rounded-md text-gray-100 text-center">
    //                                 Add Note
    //                         </div>
    //                         <div draggable="true" onDragStart={(e) => onDragStart(e, "board")}
    //                             className="p-2 cursor-grab bg-gray-400 hover:bg-gray-300 rounded-md text-gray-100 text-center">
    //                                 Add Board
    //                         </div>
    //                     </motion.div>
    //                 )}
    //             </AnimatePresence>
    //         </div>
    // )
}

export default Toolbar;