import React from 'react';
import { useBreadcrumb } from '../context/BreadcrumbContext';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
    const { breadcrumbPath, goToBoard } = useBreadcrumb();
    const navigate = useNavigate();

    const goToABoard = (board) => {
        navigate(`/board/${board.id}`);
        goToBoard(board);
    };

    return (
        <div id="topbar" className="h-10 bg-gray-900 text-white flex flex-1 items-center p-4">
            {breadcrumbPath.map((board, index) => (
                <React.Fragment key={board.id}>
                    <button className="text-blue-500 hover:underline" onClick={() => goToABoard(board)}>
                        {board.name}
                    </button>
                    { index < breadcrumbPath.length - 1 && <span>/</span>}
                </React.Fragment>
            ))}
        </div>
    );
};

export default Topbar;