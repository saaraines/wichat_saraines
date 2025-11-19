import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function AdminLayout({ children }) {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        WIChat - Admin
                    </Typography>
                    <Box>
                        <Button color="inherit" onClick={handleLogout}>
                            CERRAR SESIÓN
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>
            {children}
        </>
    );
}

export default AdminLayout;