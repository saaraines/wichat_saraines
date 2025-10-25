import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Box,
    Chip,
    CircularProgress
} from '@mui/material';
import axios from 'axios';

function UserManagement({ onBack }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    // Cargar usuarios al montar el componente
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(`${apiEndpoint}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setUsers(response.data);
            setLoading(false);
        } catch (error) {
            // NUEVO: Si está bloqueado, cerrar sesión
            if (error.response?.status === 403) {
                localStorage.clear();
                window.location.href = '/';
                return;
            }

            setError('Error al cargar usuarios');
            setLoading(false);
            console.error(error);
        }
    };

    const handleBlock = async (userId, currentBlockStatus) => {
        try {
            const token = localStorage.getItem('token');

            await axios.put(
                `${apiEndpoint}/admin/users/${userId}/block`,
                { isBlocked: !currentBlockStatus },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            fetchUsers();
        } catch (error) {
            // NUEVO: Si está bloqueado, cerrar sesión
            if (error.response?.status === 403) {
                localStorage.clear();
                window.location.href = '/';
                return;
            }

            alert('Error al bloquear/desbloquear usuario');
            console.error(error);
        }
    };

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';

        try {
            const token = localStorage.getItem('token');

            await axios.put(
                `${apiEndpoint}/admin/users/${userId}/role`,
                { role: newRole },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            fetchUsers();
        } catch (error) {
            // NUEVO: Si está bloqueado, cerrar sesión
            if (error.response?.status === 403) {
                localStorage.clear();
                window.location.href = '/';
                return;
            }

            alert('Error al cambiar rol');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <Container sx={{ marginTop: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ marginTop: 4, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
                <Button onClick={onBack} sx={{ marginTop: 2 }}>Volver</Button>
            </Container>
        );
    }

    return (
        <Container sx={{ marginTop: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <Typography variant="h4">
                    Gestión de Usuarios
                </Typography>
                <Button variant="outlined" onClick={onBack}>
                    Volver
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Username</strong></TableCell>
                            <TableCell><strong>Rol</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell><strong>Fecha de Creación</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id} hover>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.role === 'admin' ? 'Admin' : 'Usuario'}
                                        color={user.role === 'admin' ? 'primary' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.isBlocked ? 'Bloqueado' : 'Activo'}
                                        color={user.isBlocked ? 'error' : 'success'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell align="center">
                                    {user.username === localStorage.getItem('username') ? (
                                        <Typography variant="body2" color="text.secondary">
                                            (Tú mismo)
                                        </Typography>
                                    ) : (
                                        <>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                onClick={() => handleBlock(user._id, user.isBlocked)}
                                                sx={{ marginRight: 1 }}
                                            >
                                                {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                onClick={() => handleRoleChange(user._id, user.role)}
                                            >
                                                {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}

export default UserManagement;