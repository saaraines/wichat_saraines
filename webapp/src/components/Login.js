import React, { useState } from 'react';
import axios from 'axios';
import { Box, TextField, Button, Alert, CircularProgress } from '@mui/material';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

  const loginUser = async () => {
    if (!username || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${apiEndpoint}/login`, { username, password });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('role', response.data.role);

      const { role } = response.data;

      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/game';
        }
      }, 500);

    } catch (error) {
      setLoading(false);
      if (error.response) {
        if (error.response.status === 403) {
          setError('Tu cuenta ha sido bloqueada. Contacta con un administrador.');
          setTimeout(() => {
            window.location.href = '/blocked';
          }, 2000);
        } else if (error.response.status === 401) {
          setError('Usuario o contraseña incorrectos');
        } else {
          setError(error.response.data.error || 'Error al iniciar sesión');
        }
      } else {
        setError('No se pudo conectar con el servidor');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      loginUser();
    }
  };

  return (
      <Box data-testid="login-form">
        {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }} data-testid="login-error-message">
              {error}
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
            autoFocus
            data-testid="login-username-input"
            inputProps={{ 'data-testid': 'login-username-field' }}
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
            data-testid="login-password-input"
            inputProps={{ 'data-testid': 'login-password-field' }}
        />

        <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={loginUser}
            disabled={loading}
            data-testid="login-submit-button"
            sx={{
              marginTop: 3,
              padding: 1.5,
              fontSize: '1rem'
            }}
        >
          {loading ? (
              <CircularProgress size={24} color="inherit" data-testid="login-loading-spinner" />
          ) : (
              'Iniciar Sesión'
          )}
        </Button>
      </Box>
  );
};

export default Login;