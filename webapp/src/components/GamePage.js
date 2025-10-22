import React from 'react';
import { Container, Typography } from '@mui/material';

function GamePage() {
    return (
        <Container sx={{ marginTop: 4 }}>
            <Typography variant="h3">
                Página del Juego
            </Typography>
            <Typography variant="body1" sx={{ marginTop: 2 }}>
                Aquí irá el juego. Por ahora es una página temporal.
            </Typography>
        </Container>
    );
}

export default GamePage;