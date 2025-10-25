// src/components/AddUser.js
import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography, TextField, Button, Snackbar, Alert } from '@mui/material';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const AddUser = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Función para validar la contraseña
    const validatePassword = () => {
        // Verificar longitud mínima
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return false;
        }

        // Verificar que contenga al menos un número
        if (!/\d/.test(password)) {
            setError('La contraseña debe contener al menos un número');
            return false;
        }

        // Verificar que las contraseñas coincidan
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }

        return true;
    };

    const addUser = async () => {
        // Validar campos vacíos
        if (!username || !password || !confirmPassword) {
            setError('Por favor, completa todos los campos');
            return;
        }

        // Validar username mínimo
        if (username.length < 3) {
            setError('El nombre de usuario debe tener al menos 3 caracteres');
            return;
        }

        // Validar contraseña
        if (!validatePassword()) {
            return;
        }

        try {
            await axios.post(`${apiEndpoint}/adduser`, { username, password });
            setSuccess(true);
            setError('');
            // Limpiar campos después de registro exitoso
            setUsername('');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            if (error.response) {
                // El backend devuelve el error en español
                setError(error.response.data.error || 'Error al registrar usuario');
            } else {
                setError('No se pudo conectar con el servidor');
            }
            setSuccess(false);
        }
    };

    const handleCloseSuccess = () => {
        setSuccess(false);
    };

    const handleCloseError = () => {
        setError('');
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ marginTop: 4 }}>
            <Typography component="h1" variant="h5">
                Registrar Usuario
            </Typography>

            <TextField
                name="username"
                margin="normal"
                fullWidth
                label="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                helperText="Mínimo 3 caracteres"
            />

            <TextField
                name="password"
                margin="normal"
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Mínimo 8 caracteres y al menos un número"
            />

            <TextField
                name="confirmPassword"
                margin="normal"
                fullWidth
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
                variant="contained"
                color="primary"
                onClick={addUser}
                sx={{ marginTop: 2 }}
            >
                Registrar
            </Button>

            {/* Snackbar de éxito */}
            <Snackbar
                open={success}
                autoHideDuration={6000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    Usuario registrado exitosamente
                </Alert>
            </Snackbar>

            {/* Snackbar de error */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AddUser;