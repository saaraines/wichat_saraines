import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    LinearProgress,
    Alert,
    Paper,
    Chip
} from '@mui/material';
import axios from 'axios';
import UserLayout from './UserLayout';
import HintChat from './HintChat';

function GamePage() {
    const [gameState, setGameState] = useState('start'); // start, playing, finished
    const [gameId, setGameId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Capitales');
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [hintChatOpen, setHintChatOpen] = useState(false);

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    // Temporizador
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0 && !showResult) {
            const timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !showResult && gameState === 'playing') {
            // Se acabó el tiempo
            handleTimeout();
        }
    }, [timeLeft, gameState, showResult]);

    const startGame = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const username = localStorage.getItem('username');
            const userId = username;

            const response = await axios.post(
                `${apiEndpoint}/game/start`,
                {
                    userId,
                    username,
                    category: selectedCategory
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setGameId(response.data.gameId);
            setQuestions(response.data.questions);
            setGameState('playing');
            setCurrentQuestionIndex(0);
            setTimeLeft(30);
            setScore(0);
            setResults([]);
            setLoading(false);
        } catch (error) {
            console.error('Error starting game:', error);
            setLoading(false);
            alert('Error al iniciar el juego');
        }
    };

    const handleTimeout = async () => {
        try {
            const token = localStorage.getItem('token');
            const currentQuestion = questions[currentQuestionIndex];

            const response = await axios.post(
                `${apiEndpoint}/game/${gameId}/answer`,
                {
                    questionId: currentQuestion._id,
                    answer: null,
                    timeSpent: 30
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setLastAnswerCorrect(false);
            setCorrectAnswer(response.data.correctAnswer);
            setScore(response.data.currentScore);
            setShowResult(true);

            const newResults = [...results, {
                question: currentQuestion.question,
                userAnswer: 'Sin respuesta',
                correctAnswer: response.data.correctAnswer,
                isCorrect: false,
                timedOut: true
            }];
            setResults(newResults);

            // Continuar después de 2 segundos
            setTimeout(() => {
                setShowResult(false);
                setSelectedAnswer('');

                if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                    setTimeLeft(30);
                } else {
                    setGameState('finished');
                }
            }, 3000);

        } catch (error) {
            console.error('Error on timeout:', error);
        }
    };

    const handleAnswerAndContinue = async (answer) => {
        if (showResult) return; // Evitar múltiples clicks

        try {
            const token = localStorage.getItem('token');
            const currentQuestion = questions[currentQuestionIndex];
            const timeSpent = 20 - timeLeft;

            const response = await axios.post(
                `${apiEndpoint}/game/${gameId}/answer`,
                {
                    questionId: currentQuestion._id,
                    answer: answer,
                    timeSpent: timeSpent
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setLastAnswerCorrect(response.data.isCorrect);
            setCorrectAnswer(response.data.correctAnswer);
            setScore(response.data.currentScore);
            setShowResult(true);

            const newResults = [...results, {
                question: currentQuestion.question,
                userAnswer: answer,
                correctAnswer: response.data.correctAnswer,
                isCorrect: response.data.isCorrect,
                timedOut: false
            }];
            setResults(newResults);

            // Continuar automáticamente después de 2 segundos
            setTimeout(() => {
                setShowResult(false);
                setSelectedAnswer('');

                if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                    setTimeLeft(20);
                } else {
                    setGameState('finished');
                }
            }, 2000);

        } catch (error) {
            console.error('Error answering question:', error);
        }
    };

    const restartGame = () => {
        setGameState('start');
        setGameId(null);
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setSelectedAnswer('');
        setTimeLeft(20);
        setScore(0);
        setResults([]);
        setShowResult(false);
    };

    // Pantalla de inicio
    if (gameState === 'start') {
        return (
            <UserLayout>
                <Container maxWidth="md" sx={{ marginTop: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ marginBottom: 2 }}>
                            Bienvenido al Juego
                        </Typography>
                        <Typography variant="body1" sx={{ marginBottom: 4, color: '#666' }}>
                            Responde 5 preguntas sobre distintas temáticas.
                            Tienes 20 segundos por pregunta.
                        </Typography>

                        {/* Selector de categoría */}
                        <Paper sx={{ padding: 3, marginBottom: 4, maxWidth: 600, margin: '0 auto 32px' }}>
                            <Typography variant="h6" sx={{ marginBottom: 2 }}>
                                Selecciona una categoría:
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                    variant={selectedCategory === 'Capitales' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedCategory('Capitales')}
                                    sx={{ minWidth: 140, padding: '12px 24px' }}
                                    size="large"
                                >
                                    🌍 Capitales
                                </Button>
                                <Button
                                    variant={selectedCategory === 'Banderas' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedCategory('Banderas')}
                                    sx={{ minWidth: 140, padding: '12px 24px' }}
                                    size="large"
                                >
                                    🚩 Banderas
                                </Button>
                                <Button
                                    variant={selectedCategory === 'Monumentos' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedCategory('Monumentos')}
                                    sx={{ minWidth: 140, padding: '12px 24px' }}
                                    size="large"
                                >
                                    🏛️ Monumentos
                                </Button>
                            </Box>
                        </Paper>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={startGame}
                            disabled={loading}
                            sx={{ padding: '15px 50px', fontSize: '1.2rem', marginRight: 2 }}
                        >
                            {loading ? 'Cargando...' : 'Comenzar Juego'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => window.location.href = '/stats'}
                            sx={{ padding: '15px 50px', fontSize: '1.2rem' }}
                        >
                            Ver Estadísticas
                        </Button>
                    </Box>
                </Container>
            </UserLayout>
        );
    }

    // Pantalla de juego
    if (gameState === 'playing' && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

        return (
            <UserLayout>
                <Container maxWidth="md" sx={{ marginTop: 4 }}>
                    {/* Header con progreso */}
                    <Box sx={{ marginBottom: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                            <Typography variant="h6">
                                Pregunta {currentQuestionIndex + 1} de {questions.length}
                            </Typography>
                            <Chip
                                label={`Puntuación: ${score}`}
                                color="primary"
                                sx={{ fontWeight: 'bold' }}
                            />
                        </Box>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>

                    {/* Temporizador */}
                    <Box sx={{ marginBottom: 3, textAlign: 'center' }}>
                        <Typography
                            variant="h4"
                            sx={{
                                color: timeLeft <= 5 ? '#d32f2f' : '#1976d2',
                                fontWeight: 'bold'
                            }}
                        >
                            {timeLeft}s
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={(timeLeft / 20) * 100}
                            sx={{
                                marginTop: 1,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: timeLeft <= 5 ? '#d32f2f' : '#1976d2'
                                }
                            }}
                        />
                    </Box>

                    {/* Pregunta */}
                    <Card sx={{ marginBottom: 3 }}>
                        <CardMedia
                            component="img"
                            height="300"
                            image={currentQuestion.imageUrl}
                            alt="Question"
                            sx={{ objectFit: 'cover' }}
                        />
                        <CardContent>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                {currentQuestion.question}
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Mostrar resultado si ya respondió */}
                    {showResult && (
                        <Alert
                            severity={lastAnswerCorrect ? 'success' : 'error'}
                            sx={{ marginBottom: 3 }}
                        >
                            {lastAnswerCorrect ? (
                                <Typography variant="h6">¡Correcto! +100 puntos</Typography>
                            ) : (
                                <Typography variant="h6">
                                    Incorrecto. La respuesta correcta era: <strong>{correctAnswer}</strong>
                                </Typography>
                            )}
                        </Alert>
                    )}

                    {/* Opciones en cuadrícula 2x2 */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 2,
                            marginBottom: 3
                        }}
                    >
                        {currentQuestion.options.map((option, index) => (
                            <Button
                                key={index}
                                variant="outlined"
                                onClick={() => {
                                    setSelectedAnswer(option);
                                    handleAnswerAndContinue(option);
                                }}
                                disabled={showResult}
                                sx={{
                                    padding: 3,
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    border: '2px solid #e0e0e0',
                                    color: '#333',
                                    backgroundColor: selectedAnswer === option ? '#e3f2fd' : 'white',
                                    '&:hover': {
                                        backgroundColor: '#f5f5f5',
                                        border: '2px solid #1976d2'
                                    },
                                    '&:disabled': {
                                        backgroundColor: selectedAnswer === option
                                            ? (showResult && selectedAnswer === correctAnswer ? '#c8e6c9' : '#ffcdd2')
                                            : 'white'
                                    }
                                }}
                            >
                                {option}
                            </Button>
                        ))}
                    </Box>

                    {/* Botón de pistas flotante */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setHintChatOpen(!hintChatOpen)}
                        disabled={showResult}
                        sx={{
                            position: 'fixed',
                            bottom: 20,
                            right: 20,
                            zIndex: 1200
                        }}
                    >
                        Pistas
                    </Button>

                    {/* Chat de pistas */}
                    <HintChat
                        open={hintChatOpen}
                        onClose={() => setHintChatOpen(false)}
                        currentQuestion={currentQuestion}
                    />
                </Container>
            </UserLayout>
        );
    }

    // Pantalla de resultados
    if (gameState === 'finished') {
        const correctCount = results.filter(r => r.isCorrect).length;
        const percentage = (correctCount / results.length) * 100;

        return (
            <UserLayout>
                <Container maxWidth="md" sx={{ marginTop: 4 }}>
                    <Paper sx={{ padding: 4, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ marginBottom: 2 }}>
                            ¡Juego Terminado!
                        </Typography>

                        <Chip
                            label={selectedCategory}
                            color="primary"
                            sx={{ marginBottom: 3, fontSize: '1rem', padding: 2 }}
                        />

                        <Typography variant="h4" sx={{ marginBottom: 3, color: '#1976d2' }}>
                            Puntuación Final: {score}
                        </Typography>

                        <Box sx={{ marginBottom: 3 }}>
                            <Typography variant="h6">
                                Respuestas correctas: {correctCount} / {results.length}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {percentage.toFixed(0)}% de acierto
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={restartGame}
                            sx={{ marginTop: 2 }}
                        >
                            Jugar de Nuevo
                        </Button>
                    </Paper>
                </Container>
            </UserLayout>
        );
    }

    return null;
}

export default GamePage;