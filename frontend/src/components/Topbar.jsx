import React from 'react';
import { useBreadcrumb } from '../context/BreadcrumbContext';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { Typography } from '@mui/material';

const Topbar = () => {
    const { breadcrumbPath, goToBoard } = useBreadcrumb();
    const navigate = useNavigate();

    const goToABoard = (board) => {
        navigate(`/board/${board.id}`);
        goToBoard(board);
    };


    return (
        <div id="topbar" className="h-10 bg-gray-900 text-white flex flex-1 items-center p-4">
        <Breadcrumbs aria-label="breadcrumb" sx={{ color: 'white'}}>
            {breadcrumbPath.map((board, index) => 
                index === breadcrumbPath.length - 1 ? (
                    <Typography key={board.id} color="white">
                        {board.name}
                    </Typography>
                ) : (
                    <Link
                        key={board.id}
                        onClick={() => goToABoard(board)}
                        style={{ cursor: 'pointer' }}
                        color='primary'
                    >
                        {board.name}
                    </Link>
                )
            )}
        </Breadcrumbs>
        </div>
    )
};

export default Topbar;