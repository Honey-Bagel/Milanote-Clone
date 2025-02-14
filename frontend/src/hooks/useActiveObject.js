import { createContext, useContext, useState } from "react";

// Create context
const ActiveObjectContext = createContext();

// Provider component
export function ActiveObjectProvider({ children }) {
    const [activeObject, setActiveObject] = useState(null);

    return (
        <ActiveObjectContext.Provider value={{ activeObject, setActiveObject }}>
            {children}
        </ActiveObjectContext.Provider>
    );
}

// Hook to use context
export function useActiveObject() {
    return useContext(ActiveObjectContext);
}