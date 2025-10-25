import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';

function UnauthorizedPage() {
    const handleGoBack = () => {
        window.location.href = '/';
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Container
                maxWidth="sm"
                sx={{
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: 2,
                    padding: 4,
                    boxShadow: 3
                }}
            >
                <Typography variant="h1" sx={{ fontSize: 80, marginBottom: 2 }}>
                    403
                </Typography>

                <Typography variant="h3" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
                    Acceso Denegado
                </Typography>

                <Typography variant="body1" sx={{ marginBottom: 1, color: '#666' }}>
                    No tienes permisos para acceder a esta página.
                </Typography>

                <Typography variant="body2" sx={{ marginBottom: 3, color: '#999' }}>
                    Si crees que deberías tener acceso, contacta con un administrador.
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGoBack}
                    sx={{ marginTop: 2 }}
                >
                    Volver al Inicio
                </Button>
            </Container>
        </Box>
    );
}

export default UnauthorizedPage;