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
    // Validación básica
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

      // Redirigir según el rol
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
      <Box>
        {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
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
        />

        <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={loginUser}
            disabled={loading}
            sx={{
              marginTop: 3,
              padding: 1.5,
              fontSize: '1rem'
            }}
        >
          {loading ? (
              <CircularProgress size={24} color="inherit" />
          ) : (
              'Iniciar Sesión'
          )}
        </Button>
      </Box>
  );
};

export default Login;