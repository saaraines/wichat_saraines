import React from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography } from '@mui/material';

function ProtectedRoute({ children, requiredRole, allowBlocked = false }) {
    const [loading, setLoading] = React.useState(true);
    const [isBlocked, setIsBlocked] = React.useState(false);
    const [unauthorized, setUnauthorized] = React.useState(false);
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    React.useEffect(() => {
        const checkStatus = async () => {
            // Verificar si tiene el rol requerido
            if (requiredRole && role !== requiredRole) {
                setUnauthorized(true);
                setLoading(false);
                return;
            }

            // Solo verificar bloqueo si es admin y no es la página de blocked
            if (requiredRole === 'admin' && !allowBlocked) {
                const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

                try {
                    await axios.get(`${apiEndpoint}/admin/users`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    setLoading(false);
                } catch (error) {
                    if (error.response?.status === 403) {
                        setIsBlocked(true);
                        setLoading(false);
                    } else {
                        setLoading(false);
                    }
                }
            } else {
                setLoading(false);
            }
        };

        checkStatus();
    }, [token, role, requiredRole, allowBlocked]);

    // PRIMERO: Si no hay token, redirigir inmediatamente
    if (!token) {
        return <Navigate to="/" />;
    }

    if (loading) {
        return (
            <Container sx={{ marginTop: 4, textAlign: 'center' }}>
                <Typography>Cargando...</Typography>
            </Container>
        );
    }

    // Si está bloqueado y no es la página de blocked, redirigir
    if (isBlocked && !allowBlocked) {
        localStorage.clear();
        return <Navigate to="/blocked" />;
    }

    // Si no tiene autorización (rol incorrecto), ir a /unauthorized
    if (unauthorized) {
        return <Navigate to="/unauthorized" />;
    }

    return children;
}

export default ProtectedRoute;