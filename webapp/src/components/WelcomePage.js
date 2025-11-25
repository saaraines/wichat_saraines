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
        >
            <Container component="main" maxWidth="sm">
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        borderRadius: 2,
                        backgroundColor: 'white'
                    }}
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
                    >
                        Sistema de gestión de usuarios - ASW 2024/2025
                    </Typography>

                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        centered
                        sx={{ marginBottom: 3 }}
                    >
                        <Tab label="Iniciar Sesión" />
                        <Tab label="Registrarse" />
                    </Tabs>

                    <Box>
                        {activeTab === 0 ? <Login /> : <AddUser />}
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default WelcomePage;