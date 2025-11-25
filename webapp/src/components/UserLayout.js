import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function UserLayout({ children }) {
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
                        WIChat - {username}
                    </Typography>
                    <Box>
                        <Button color="inherit" onClick={() => navigate('/game')}>
                            Jugar
                        </Button>
                        <Button color="inherit" onClick={() => navigate('/stats')}>
                            Estadísticas
                        </Button>
                        <Button color="inherit" onClick={handleLogout}>
                            Cerrar Sesión
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>
            {children}
        </>
    );
}

export default UserLayout;