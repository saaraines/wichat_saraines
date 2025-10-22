import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AddUser from './components/AddUser';
import Login from './components/Login';
import GamePage from './components/GamePage';
import BlockedPage from './components/BlockedPage';
import AdminDashboard from './components/AdminDashboard';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

// Página de bienvenida (Login/Register)
function WelcomePage() {
    const [showLogin, setShowLogin] = useState(true);

    const handleToggleView = () => {
        setShowLogin(!showLogin);
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Typography component="h1" variant="h5" align="center" sx={{ marginTop: 2 }}>
                Welcome to the 2025 edition of the Software Architecture course!
            </Typography>
            {showLogin ? <Login /> : <AddUser />}
            <Typography component="div" align="center" sx={{ marginTop: 2 }}>
                {showLogin ? (
                    <Link name="gotoregister" component="button" variant="body2" onClick={handleToggleView}>
                        Don't have an account? Register here.
                    </Link>
                ) : (
                    <Link component="button" variant="body2" onClick={handleToggleView}>
                        Already have an account? Login here.
                    </Link>
                )}
            </Typography>
        </Container>
    );
}

// Componente principal con las rutas
function App() {
    return (
        <Router>
            <CssBaseline />
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/blocked" element={<BlockedPage />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;