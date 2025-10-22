import React from 'react';
import { Container, Typography } from '@mui/material';

function AdminDashboard() {
    return (
        <Container sx={{ marginTop: 4 }}>
            <Typography variant="h3">
                Dashboard de Administrador
            </Typography>
            <Typography variant="body1" sx={{ marginTop: 2 }}>
                Aquí irá el panel de gestión de usuarios.
            </Typography>
        </Container>
    );
}

export default AdminDashboard;