import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GamePage from './components/GamePage';
import BlockedPage from './components/BlockedPage';
import UnauthorizedPage from './components/UnauthorizedPage';
import AdminDashboard from './components/AdminDashboard';
import WelcomePage from './components/WelcomePage';
import ProtectedRoute from './components/ProtectedRoute';
import UserStats from './components/UserStats';

function AppRoutes() {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Página de bloqueados - solo accesible si intentaron login */}
            <Route path="/blocked" element={<BlockedPage />} />

            {/* Rutas protegidas - requieren estar logueado */}
            <Route
                path="/game"
                element={
                    <ProtectedRoute>
                        <GamePage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/stats"
                element={
                    <ProtectedRoute>
                        <UserStats />
                    </ProtectedRoute>
                }
            />

            {/* Cualquier otra ruta redirige al login */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default AppRoutes;