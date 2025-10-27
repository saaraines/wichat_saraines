import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Chip,
    TablePagination
} from '@mui/material';
import axios from 'axios';
import UserLayout from './UserLayout';

function UserStats() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [stats, setStats] = useState({
        totalGames: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        averageScore: 0,
        successRate: 0
    });

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    useEffect(() => {
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const username = localStorage.getItem('username');
            const userId = username;

            const response = await axios.get(`${apiEndpoint}/game/history/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const gamesData = response.data;
            setGames(gamesData);

            const totalGames = gamesData.length;
            const totalQuestions = gamesData.reduce((sum, game) => sum + game.totalQuestions, 0);
            const correctAnswers = gamesData.reduce((sum, game) => sum + game.correctAnswers, 0);
            const incorrectAnswers = gamesData.reduce((sum, game) => sum + game.incorrectAnswers, 0);
            const totalScore = gamesData.reduce((sum, game) => sum + game.score, 0);
            const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
            const successRate = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : 0;

            setStats({
                totalGames,
                totalQuestions,
                correctAnswers,
                incorrectAnswers,
                averageScore,
                successRate
            });

            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError('Error al cargar las estadísticas');
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) {
        return (
            <UserLayout>
                <Container sx={{ marginTop: 4, textAlign: 'center' }}>
                    <CircularProgress />
                </Container>
            </UserLayout>
        );
    }

    if (error) {
        return (
            <UserLayout>
                <Container sx={{ marginTop: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Container>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <Container sx={{ marginTop: 4, maxWidth: 'lg' }}>
                <Typography variant="h4" sx={{ marginBottom: 3 }}>
                    Mis Estadísticas
                </Typography>

                {/* Resumen general */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, marginBottom: 4 }}>
                    <Paper sx={{ padding: 3, textAlign: 'center' }}>
                        <Typography variant="h3" color="primary">
                            {stats.totalGames}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Partidas Jugadas
                        </Typography>
                    </Paper>

                    <Paper sx={{ padding: 3, textAlign: 'center' }}>
                        <Typography variant="h3" color="success.main">
                            {stats.correctAnswers}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Respuestas Correctas
                        </Typography>
                    </Paper>

                    <Paper sx={{ padding: 3, textAlign: 'center' }}>
                        <Typography variant="h3" color="error.main">
                            {stats.incorrectAnswers}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Respuestas Incorrectas
                        </Typography>
                    </Paper>

                    <Paper sx={{ padding: 3, textAlign: 'center' }}>
                        <Typography variant="h3" color="primary">
                            {stats.successRate}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tasa de Acierto
                        </Typography>
                    </Paper>

                    <Paper sx={{ padding: 3, textAlign: 'center' }}>
                        <Typography variant="h3" color="primary">
                            {stats.averageScore}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Puntuación Media
                        </Typography>
                    </Paper>
                </Box>

                {/* Historial de partidas */}
                <Typography variant="h5" sx={{ marginBottom: 2 }}>
                    Historial de Partidas
                </Typography>

                {games.length === 0 ? (
                    <Alert severity="info">
                        No has jugado ninguna partida todavía. ¡Empieza a jugar para ver tus estadísticas!
                    </Alert>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell><strong>Fecha</strong></TableCell>
                                    <TableCell><strong>Categoría</strong></TableCell>
                                    <TableCell align="center"><strong>Aciertos</strong></TableCell>
                                    <TableCell align="center"><strong>Fallos</strong></TableCell>
                                    <TableCell align="center"><strong>Puntuación</strong></TableCell>
                                    <TableCell align="center"><strong>% Acierto</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {games
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((game) => {
                                        const successRate = ((game.correctAnswers / game.totalQuestions) * 100).toFixed(0);
                                        return (
                                            <TableRow key={game._id} hover>
                                                <TableCell>
                                                    {new Date(game.completedAt).toLocaleDateString()} {' '}
                                                    {new Date(game.completedAt).toLocaleTimeString()}
                                                </TableCell>
                                                <TableCell>{game.category}</TableCell>
                                                <TableCell align="center">
                                                    <Chip label={game.correctAnswers} color="success" size="small" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip label={game.incorrectAnswers} color="error" size="small" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <strong>{game.score}</strong>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {successRate}%
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={games.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[15, 30, 50]}
                            labelRowsPerPage="Partidas por página:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        />
                    </TableContainer>
                )}
            </Container>
        </UserLayout>
    );
}

export default UserStats;