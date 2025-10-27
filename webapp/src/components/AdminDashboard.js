import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Box, Card, CardContent, CardActionArea } from '@mui/material';
import UserManagement from './UserManagement';
import QuestionManagement from './QuestionManagement';
import AdminStats from './AdminStats';

function AdminDashboard() {
    const [selectedSection, setSelectedSection] = useState(null);
    const [loading, setLoading] = useState(true);

    // Verificar que sea admin y no esté bloqueado
    useEffect(() => {
        const verifyAccess = async () => {
            const role = localStorage.getItem('role');
            const token = localStorage.getItem('token');

            // Verificar rol
            if (role !== 'admin') {
                window.location.href = '/game';
                return;
            }

            // Verificar que no esté bloqueado
            const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

            try {
                await axios.get(`${apiEndpoint}/admin/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setLoading(false); // Solo si todo va bien
            } catch (error) {
                if (error.response?.status === 403) {
                    localStorage.clear();
                    window.location.href = '/';
                }
            }
        };

        verifyAccess();
    }, []);

    // Mostrar loading mientras verifica
    if (loading) {
        return (
            <Container sx={{ marginTop: 4, textAlign: 'center' }}>
                <Typography>Cargando...</Typography>
            </Container>
        );
    }

    // Si hay una sección seleccionada, mostrarla
    if (selectedSection === 'users') {
        return <UserManagement onBack={() => setSelectedSection(null)} />;
    }

    if (selectedSection === 'questions') {
        return <QuestionManagement onBack={() => setSelectedSection(null)} />;
    }

    if (selectedSection === 'stats') {
        return <AdminStats onBack={() => setSelectedSection(null)} />;
    }



    // Vista principal con los 3 botones
    return (
        <Container sx={{ marginTop: 4 }}>
            <Typography variant="h3" sx={{ marginBottom: 4, textAlign: 'center' }}>
                Panel de Administración
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    gap: 3,
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}
            >
                {/* Botón Usuarios */}
                <Card sx={{ width: 250, boxShadow: 2 }}>
                    <CardActionArea onClick={() => setSelectedSection('users')}>
                        <CardContent sx={{ textAlign: 'center', padding: 4 }}>
                            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                USUARIOS
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ marginTop: 2 }}>
                                Gestionar usuarios del sistema
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>

                {/* Botón Estadísticas */}
                <Card sx={{ width: 250, boxShadow: 2 }}>
                    <CardActionArea onClick={() => setSelectedSection('stats')}>
                        <CardContent sx={{ textAlign: 'center', padding: 4 }}>
                            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                ESTADÍSTICAS
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ marginTop: 2 }}>
                                Ver métricas del sistema
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>

                {/* Botón Preguntas (antes era Categorías) */}
                <Card sx={{ width: 250, boxShadow: 2 }}>
                    <CardActionArea onClick={() => setSelectedSection('questions')}>
                        <CardContent sx={{ textAlign: 'center', padding: 4 }}>
                            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                                PREGUNTAS
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ marginTop: 2 }}>
                                Generar y gestionar preguntas del juego
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </Box>
        </Container>
    );
}

export default AdminDashboard;