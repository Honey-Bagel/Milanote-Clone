import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';

const BreadcrumbContext = createContext();

export const BreadcrumbProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [breadcrumbPath, setBreadcrumbPath] = useState([]);

    const openBoard = (board) => {
        setBreadcrumbPath((prevPath) => [...prevPath, { id: board.id, name: board.name }]);
    };

    const goToBoard = (board) => {
        const index = breadcrumbPath.indexOf(board);
        //setBreadcrumbPath((prevPath) => prevPath.slice(0, index + 1));
    };

    return (
        <BreadcrumbContext.Provider value={{ breadcrumbPath, openBoard, goToBoard, setBreadcrumbPath }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};
export const useBreadcrumb = () => {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error("useBreadcrumbs must be used within a BreadcrumbProvider");
    }
    return context;
};