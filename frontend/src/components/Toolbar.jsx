import { Point } from "fabric";
import { useActiveObject } from "../hooks/useActiveObject";
import { AnimatePresence, motion } from "motion/react";
import { useState, useRef, useEffect } from 'react';
import { BlockPicker } from 'react-color';
import { Board } from "../utils/objects/boardObject";

const Toolbar = (props) => {
	const { canvasInstanceRef, lastPosX, lastPosY } = props.props;
	const { activeObject } = useActiveObject();
    const [color, setColor] = useState("#ffffff");
    const [toggleColor, setToggleColor] = useState(false);
    const pickerRef = useRef(null);

    useEffect(() => {
        if(!activeObject) {
            setToggleColor(false);
        } else {
            setColor(activeObject[0].getColor())
        }
    }, [activeObject]);

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
			<AnimatePresence mode="wait">
				{activeObject ? (
					<motion.div
						key="customize"
						initial={{ x: "-100%"}}
						animate={{ x: 0}}
						exit={{ x: "-100%"}}
						transition={{ duration: 0.1, ease: "easeInOut"}}
					>
                        <div id="Color changer">
                            <button onClick={() => setToggleColor(!toggleColor)}>color</button>
                            {toggleColor && (
                                <div ref={pickerRef} className="absolute left-20 top-25 z-50 shadow-lg">
                                    <BlockPicker
                                        color={color}
                                        onChangeComplete={(color) => {
                                            console.log('1')
                                            setColor(color.hex);
                                            activeObject[0].setColor(color.hex);
                                            canvasInstanceRef.current.renderAll();
                                        }}
                                        triangle="hide"
                                    />
                                </div>
                            )}
                        </div>
					</motion.div>
				) : (
					<motion.div 
						key="objects"
						initial={{ x: "-100%"}}
						animate={{ x: 0}}
						exit={{ x: "-100%"}}
						transition={{ duration: 0.1, ease: "easeInOut"}}
                        className='flex flex-col p-4 space-y-4'
					>
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
					</motion.div>
				)}
			</AnimatePresence>
			
		</div>
	)

}

export default Toolbar;