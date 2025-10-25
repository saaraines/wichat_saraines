import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import AppRoutes from './routes';

function App() {
    return (
        <Router>
            <CssBaseline />
            <AppRoutes />
        </Router>
    );
}

export default App;