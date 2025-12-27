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
    const [gameState, setGameState] = useState('start');
    const [gameId, setGameId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Capitales');
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [hintChatOpen, setHintChatOpen] = useState(false);

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0 && !showResult) {
            const timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !showResult && gameState === 'playing') {
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
            setTimeLeft(60);
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
                    timeSpent: 60
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

            setTimeout(() => {
                setShowResult(false);
                setSelectedAnswer('');

                if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                    setTimeLeft(60);
                } else {
                    setGameState('finished');
                }
            }, 3000);

        } catch (error) {
            console.error('Error on timeout:', error);
        }
    };

    const handleAnswerAndContinue = async (answer) => {
        if (showResult) return;

        try {
            const token = localStorage.getItem('token');
            const currentQuestion = questions[currentQuestionIndex];
            const timeSpent = 60 - timeLeft;

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

            setTimeout(() => {
                setShowResult(false);
                setSelectedAnswer('');

                if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                    setTimeLeft(60);
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
        setTimeLeft(60);
        setScore(0);
        setResults([]);
        setShowResult(false);
    };

    if (gameState === 'start') {
        return (
            <UserLayout>
                <Container maxWidth="md" sx={{ marginTop: 4 }} data-testid="game-start-screen">
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ marginBottom: 2 }} data-testid="game-welcome-title">
                            Bienvenido al Juego
                        </Typography>
                        <Typography variant="body1" sx={{ marginBottom: 4, color: '#666' }}>
                            Selecciona una categoría y pon a prueba tus conocimientos
                        </Typography>

                        <Paper sx={{ padding: 3, marginBottom: 3 }} data-testid="category-selector">
                            <Typography variant="h6" sx={{ marginBottom: 2 }}>
                                Selecciona una categoría:
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                <Button
                                    variant={selectedCategory === 'Capitales' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedCategory('Capitales')}
                                    size="large"
                                    data-testid="category-capitales-button"
                                >
                                    🏙️ Capitales
                                </Button>
                                <Button
                                    variant={selectedCategory === 'Banderas' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedCategory('Banderas')}
                                    size="large"
                                    data-testid="category-banderas-button"
                                >
                                    🚩 Banderas
                                </Button>
                                <Button
                                    variant={selectedCategory === 'Monumentos' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedCategory('Monumentos')}
                                    size="large"
                                    data-testid="category-monumentos-button"
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
                            data-testid="start-game-button"
                        >
                            {loading ? 'Cargando...' : 'Comenzar Juego'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => window.location.href = '/stats'}
                            sx={{ padding: '15px 50px', fontSize: '1.2rem' }}
                            data-testid="view-stats-button"
                        >
                            Ver Estadísticas
                        </Button>
                    </Box>
                </Container>
            </UserLayout>
        );
    }

    if (gameState === 'playing' && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

        return (
            <UserLayout>
                <Container maxWidth="md" sx={{ marginTop: 4 }} data-testid="game-playing-screen">
                    <Box sx={{ marginBottom: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                            <Typography variant="h6" data-testid="question-counter">
                                Pregunta {currentQuestionIndex + 1} de {questions.length}
                            </Typography>
                            <Chip
                                label={`Puntuación: ${score}`}
                                color="primary"
                                sx={{ fontWeight: 'bold' }}
                                data-testid="current-score"
                            />
                        </Box>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} data-testid="game-progress" />
                    </Box>

                    <Box sx={{ marginBottom: 3, textAlign: 'center' }}>
                        <Typography
                            variant="h4"
                            sx={{
                                color: timeLeft <= 5 ? '#d32f2f' : '#1976d2',
                                fontWeight: 'bold'
                            }}
                            data-testid="time-left"
                        >
                            {timeLeft}s
                        </Typography>
                    </Box>

                    <Card sx={{ marginBottom: 3 }} data-testid="question-card">
                        <CardMedia
                            component="img"
                            height="300"
                            image={currentQuestion.imageUrl}
                            alt="Question"
                            sx={{ objectFit: 'cover' }}
                            data-testid="question-image"
                        />
                        <CardContent>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }} data-testid="question-text">
                                {currentQuestion.question}
                            </Typography>
                        </CardContent>
                    </Card>

                    {showResult && (
                        <Alert
                            severity={lastAnswerCorrect ? 'success' : 'error'}
                            sx={{ marginBottom: 3 }}
                            data-testid="answer-result"
                        >
                            {lastAnswerCorrect ? (
                                <Typography variant="h6" data-testid="correct-answer-message">¡Correcto! +100 puntos</Typography>
                            ) : (
                                <Typography variant="h6" data-testid="wrong-answer-message">
                                    Incorrecto. La respuesta correcta era: <strong>{correctAnswer}</strong>
                                </Typography>
                            )}
                        </Alert>
                    )}

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 2,
                            marginBottom: 3
                        }}
                        data-testid="answer-options"
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
                                data-testid={`answer-option-${index}`}
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

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setHintChatOpen(!hintChatOpen)}
                        disabled={showResult}
                        data-testid="hint-button"
                        sx={{
                            position: 'fixed',
                            bottom: 20,
                            right: 20,
                            zIndex: 1200
                        }}
                    >
                        Pistas
                    </Button>

                    <HintChat
                        open={hintChatOpen}
                        onClose={() => setHintChatOpen(false)}
                        currentQuestion={currentQuestion}
                    />
                </Container>
            </UserLayout>
        );
    }

    if (gameState === 'finished') {
        const correctCount = results.filter(r => r.isCorrect).length;
        const percentage = (correctCount / results.length) * 100;

        return (
            <UserLayout>
                <Container maxWidth="md" sx={{ marginTop: 4 }} data-testid="game-finished-screen">
                    <Paper sx={{ padding: 4, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ marginBottom: 2 }} data-testid="game-over-title">
                            ¡Juego Terminado!
                        </Typography>

                        <Chip
                            label={selectedCategory}
                            color="primary"
                            sx={{ marginBottom: 3, fontSize: '1rem', padding: 2 }}
                            data-testid="finished-category"
                        />

                        <Typography variant="h4" sx={{ marginBottom: 3, color: '#1976d2' }} data-testid="final-score">
                            Puntuación Final: {score}
                        </Typography>

                        <Box sx={{ marginBottom: 3 }}>
                            <Typography variant="h6" data-testid="correct-count">
                                Respuestas correctas: {correctCount} / {results.length}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" data-testid="percentage">
                                {percentage.toFixed(0)}% de acierto
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={restartGame}
                            sx={{ marginTop: 2 }}
                            data-testid="play-again-button"
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