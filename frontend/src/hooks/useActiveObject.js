import { createContext, useContext, useState } from "react";

// Create context
const ActiveObjectContext = createContext();

// Provider component
export function ActiveObjectProvider({ children }) {
    const [activeObject, setActiveObject] = useState(null);
    const [isEditing, setEditing] = useState(false);

    return (
        <ActiveObjectContext.Provider value={{ activeObject, setActiveObject, isEditing, setEditing }}>
            {children}
        </ActiveObjectContext.Provider>
    );
}

// Hook to use context
export function useActiveObject() {
    return useContext(ActiveObjectContext);
}