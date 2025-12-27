import React, { useState } from 'react';
import axios from 'axios';
import { Box, TextField, Button, Alert, CircularProgress } from '@mui/material';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const AddUser = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const validatePassword = () => {
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return false;
        }

        if (!/\d/.test(password)) {
            setError('La contraseña debe contener al menos un número');
            return false;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }

        return true;
    };

    const addUser = async () => {
        if (!username || !password || !confirmPassword) {
            setError('Por favor, completa todos los campos');
            return;
        }

        if (username.length < 3) {
            setError('El nombre de usuario debe tener al menos 3 caracteres');
            return;
        }

        if (!validatePassword()) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await axios.post(`${apiEndpoint}/adduser`, { username, password });
            setSuccess(true);
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            setLoading(false);
        } catch (error) {
            setLoading(false);
            if (error.response) {
                setError(error.response.data.error || 'Error al registrar usuario');
            } else {
                setError('No se pudo conectar con el servidor');
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addUser();
        }
    };

    return (
        <Box data-testid="register-form">
            {error && (
                <Alert severity="error" sx={{ marginBottom: 2 }} onClose={() => setError('')} data-testid="register-error-message">
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ marginBottom: 2 }} onClose={() => setSuccess(false)} data-testid="register-success-message">
                    Usuario registrado exitosamente. Ya puedes iniciar sesión.
                </Alert>
            )}

            <TextField
                margin="normal"
                fullWidth
                label="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                helperText="Mínimo 3 caracteres"
                autoFocus
                data-testid="register-username-input"
                inputProps={{ 'data-testid': 'register-username-field' }}
            />

            <TextField
                margin="normal"
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                helperText="Mínimo 8 caracteres y al menos un número"
                data-testid="register-password-input"
                inputProps={{ 'data-testid': 'register-password-field' }}
            />

            <TextField
                margin="normal"
                fullWidth
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                data-testid="register-confirm-password-input"
                inputProps={{ 'data-testid': 'register-confirm-password-field' }}
            />

            <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={addUser}
                disabled={loading}
                data-testid="register-submit-button"
                sx={{
                    marginTop: 3,
                    padding: 1.5,
                    fontSize: '1rem'
                }}
            >
                {loading ? (
                    <CircularProgress size={24} color="inherit" data-testid="register-loading-spinner" />
                ) : (
                    'Registrarse'
                )}
            </Button>
        </Box>
    );
};

export default AddUser;