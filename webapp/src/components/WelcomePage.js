import React, { useState } from 'react';
import AddUser from './AddUser';
import Login from './Login';
import { Container, Typography, Box, Paper, Tabs, Tab } from '@mui/material';

function WelcomePage() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2
            }}
            data-testid="welcome-page"
        >
            <Container component="main" maxWidth="sm">
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        borderRadius: 2,
                        backgroundColor: 'white'
                    }}
                    data-testid="welcome-paper"
                >
                    <Typography
                        component="h1"
                        variant="h4"
                        align="center"
                        sx={{
                            marginBottom: 3,
                            fontWeight: 'bold',
                            color: '#1976d2'
                        }}
                        data-testid="app-title"
                    >
                        WIChat
                    </Typography>

                    <Typography
                        variant="body2"
                        align="center"
                        sx={{
                            marginBottom: 3,
                            color: '#666'
                        }}
                        data-testid="app-subtitle"
                    >
                        Juego de preguntas - ASW 2024/2025
                    </Typography>

                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        centered
                        sx={{ marginBottom: 3 }}
                        data-testid="auth-tabs"
                    >
                        <Tab label="Iniciar Sesión" data-testid="login-tab" />
                        <Tab label="Registrarse" data-testid="register-tab" />
                    </Tabs>

                    <Box data-testid="auth-content">
                        {activeTab === 0 ? <Login /> : <AddUser />}
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default WelcomePage;