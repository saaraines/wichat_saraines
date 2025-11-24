import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TablePagination
} from '@mui/material';
import axios from 'axios';

function AdminStats({ onBack }) {
    const [allGames, setAllGames] = useState([]);
    const [filteredGames, setFilteredGames] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [globalStats, setGlobalStats] = useState({
        totalGames: 0,
        totalQuestions: 0,
        totalAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        averageSuccessRate: 0,
        totalPlayers: 0
    });

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        filterGamesByUser();
    }, [selectedUser, allGames]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const usersResponse = await axios.get(`${apiEndpoint}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUsers(usersResponse.data);

            const gamesPromises = usersResponse.data.map(user =>
                axios.get(`${apiEndpoint}/game/history/${user.username}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }).catch(() => ({ data: [] }))
            );

            const gamesResponses = await Promise.all(gamesPromises);
            const allGamesData = gamesResponses.flatMap(response => response.data);

            setAllGames(allGamesData);
            calculateGlobalStats(allGamesData, usersResponse.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            setError('Error al cargar las estadísticas');
            setLoading(false);
        }
    };

    const calculateGlobalStats = (games, usersData) => {
        const totalGames = games.length;
        const totalQuestions = games.reduce((sum, game) => sum + game.totalQuestions, 0);
        const totalAnswered = games.reduce((sum, game) => sum + (game.correctAnswers + game.incorrectAnswers), 0);
        const correctAnswers = games.reduce((sum, game) => sum + game.correctAnswers, 0);
        const incorrectAnswers = games.reduce((sum, game) => sum + game.incorrectAnswers, 0);
        const averageSuccessRate = totalAnswered > 0 ? ((correctAnswers / totalAnswered) * 100).toFixed(1) : 0;

        const playersSet = new Set(games.map(game => game.userId));
        const totalPlayers = playersSet.size;

        setGlobalStats({
            totalGames,
            totalQuestions,
            totalAnswered,
            correctAnswers,
            incorrectAnswers,
            averageSuccessRate,
            totalPlayers
        });
    };

    const filterGamesByUser = () => {
        let filtered;
        if (selectedUser === 'all') {
            filtered = allGames;
        } else {
            filtered = allGames.filter(game => game.userId === selectedUser);
        }

        // Ordenar de más reciente a más antigua
        filtered.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        setFilteredGames(filtered);
        setPage(0);
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
            <Container sx={{ marginTop: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ marginTop: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button onClick={onBack} sx={{ marginTop: 2 }}>Volver</Button>
            </Container>
        );
    }

    return (
        <Container sx={{ marginTop: 4, maxWidth: 'xl' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <Typography variant="h4">
                    Estadísticas del Sistema
                </Typography>
                <Button variant="outlined" onClick={onBack}>
                    Volver
                </Button>
            </Box>

            <Typography variant="h5" sx={{ marginBottom: 2 }}>
                Resumen Global
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, marginBottom: 4 }}>
                <Paper sx={{ padding: 3, textAlign: 'center' }}>
                    <Typography variant="h3" color="primary">
                        {globalStats.totalGames}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Partidas Totales
                    </Typography>
                </Paper>

                <Paper sx={{ padding: 3, textAlign: 'center' }}>
                    <Typography variant="h3" color="primary">
                        {globalStats.totalPlayers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Jugadores Activos
                    </Typography>
                </Paper>

                <Paper sx={{ padding: 3, textAlign: 'center' }}>
                    <Typography variant="h3" color="primary">
                        {globalStats.totalAnswered}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Preguntas Respondidas
                    </Typography>
                </Paper>

                <Paper sx={{ padding: 3, textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main">
                        {globalStats.correctAnswers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Respuestas Correctas
                    </Typography>
                </Paper>

                <Paper sx={{ padding: 3, textAlign: 'center' }}>
                    <Typography variant="h3" color="error.main">
                        {globalStats.incorrectAnswers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Respuestas Incorrectas
                    </Typography>
                </Paper>

                <Paper sx={{ padding: 3, textAlign: 'center' }}>
                    <Typography variant="h3" color="primary">
                        {globalStats.averageSuccessRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Tasa Media de Acierto
                    </Typography>
                </Paper>
            </Box>

            <Box sx={{ marginBottom: 3 }}>
                <FormControl sx={{ minWidth: 300 }}>
                    <InputLabel>Filtrar por Usuario</InputLabel>
                    <Select
                        value={selectedUser}
                        label="Filtrar por Usuario"
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <MenuItem value="all">Todos los usuarios</MenuItem>
                        {users.map((user) => (
                            <MenuItem key={user._id} value={user.username}>
                                {user.username} ({user.role === 'admin' ? 'Admin' : 'Usuario'})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Typography variant="h5" sx={{ marginBottom: 2 }}>
                Historial de Partidas {selectedUser !== 'all' && `- ${selectedUser}`}
            </Typography>

            {filteredGames.length === 0 ? (
                <Alert severity="info">
                    No hay partidas registradas {selectedUser !== 'all' && 'para este usuario'}.
                </Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Usuario</strong></TableCell>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>Categoría</strong></TableCell>
                                <TableCell align="center"><strong>Preguntas</strong></TableCell>
                                <TableCell align="center"><strong>Aciertos</strong></TableCell>
                                <TableCell align="center"><strong>Fallos</strong></TableCell>
                                <TableCell align="center"><strong>Puntuación</strong></TableCell>
                                <TableCell align="center"><strong>% Acierto</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredGames
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((game) => {
                                    const successRate = ((game.correctAnswers / game.totalQuestions) * 100).toFixed(0);
                                    return (
                                        <TableRow key={game._id} hover>
                                            <TableCell>{game.username}</TableCell>
                                            <TableCell>
                                                {new Date(game.completedAt).toLocaleDateString()} {' '}
                                                {new Date(game.completedAt).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell>{game.category}</TableCell>
                                            <TableCell align="center">{game.totalQuestions}</TableCell>
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
                        count={filteredGames.length}
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
    );
}

export default AdminStats;