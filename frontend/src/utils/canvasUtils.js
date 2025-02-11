import { addNote, addBoard } from './objectUtilities/objectUtilities';
import { addNoteEventListeners } from './objectUtilities/noteObjectUtilities';

// Handle adding objects to the canvas
export const addObjectToCanvas = (canvas, boardId, objType, info, navigate, updateBreadcrumb) => {
    // Types = Note, Image, Board
    let object = null;
    console.log(objType);
    switch(objType) {
        case "note":
            object = addNote(boardId, info);
            break;
        case "board":
            object = addBoard(boardId, info, navigate, updateBreadcrumb);
            break;
        default:
            console.log(objType + ' is not a valid object type.');
            break;
    }
    if(!object) {
        console.log('No object was created, cannot add to canvas');
    }

    checkEdges(canvas, object);
    canvas.add(object); // Add the created object to the canvas
    attachObjectEvents(canvas, objType, boardId, object); // Attach necessary events to object
}

const checkEdges = (canvas, object) => {
    if(!canvas || !object) return;

    const { x, y } = object.position;

    if(x < canvas.left) {
        canvas.left = x;
    }
    if(x > canvas.right) {
        canvas.right = x;
    }
    if(y < canvas.top) {
        canvas.top = y;
    }
    if(y > canvas.bottom) {
        canvas.bottom = y;
    }
}

// Handle attaching events to objects
export const attachObjectEvents = async (canvas, type, boardId, object) => {
    switch(type) {
        case "note":
            addNoteEventListeners(canvas, boardId, object); // Add the event listeners for a Note object
            break;
        case "board":
            break;
        default:
            console.log('Invalid object type.');
            break;
    }

    // /*
    //     General events every object should have
    // */
    // object.on('modified', (event) => {
    //     if(event.target.id !== object.id) return; // Ensure the event is targeting the correct object

    //     try{
    //         updateNote(object.id, boardId, { // Update note matching the id
    //             position: {
    //                 x: object.left,
    //                 y: object.top,
    //             },
    //             width: Math.round(object.width), // Round width/height values so we don't end up with decimals
    //             height: Math.round(object.height),
    //         }).then((res) => {
    //             console.log(res);
    //         });
    //     } catch (e) {
    //         console.log("Error modifying object(", object.id, ")");
    //     }
    // });

    // // Handles when an object's scale gets modified
    // object.on('scaled', () => {
    //     object.set({ scaleX: 1, scaleY: 1 }); // Basically cancels the scale operation, so objects can't be scaled
    //     canvas.renderAll(); // Re-render canvas to update for changes
    // });
};