import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';

function BlockedPage() {
    const handleGoBack = () => {
        window.location.href = '/';
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#d32f2f',
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
                <Typography variant="h3" sx={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: 2 }}>
                    CUENTA BLOQUEADA
                </Typography>

                <Typography variant="body1" sx={{ marginBottom: 1, color: '#666' }}>
                    Tu cuenta ha sido bloqueada por un administrador.
                </Typography>

                <Typography variant="body2" sx={{ marginBottom: 3, color: '#999' }}>
                    Si crees que esto es un error, contacta con el soporte técnico.
                </Typography>

                <Button
                    variant="contained"
                    color="error"
                    onClick={handleGoBack}
                    sx={{ marginTop: 2 }}
                >
                    Volver al Login
                </Button>
            </Container>
        </Box>
    );
}

export default BlockedPage;