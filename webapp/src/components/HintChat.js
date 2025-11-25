import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    CircularProgress,
    Fade
} from '@mui/material';

function HintChat({
                      open,
                      onClose,
                      currentQuestion
                  }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Resetear cuando cambia la pregunta
    useEffect(() => {
        if (currentQuestion) {
            setMessages([]);
            setInputMessage('');
        }
    }, [currentQuestion?._id]);

    // Focus en el input cuando se abre el chat
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || loading || !currentQuestion) return;

        const userMessage = {
            role: 'user',
            content: inputMessage
        };

        // Añadir mensaje del usuario
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputMessage('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            // Construir historial para enviar (sin el mensaje actual que ya está incluido)
            const history = messages;

            const response = await fetch(`${apiEndpoint}/hint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    correctAnswer: currentQuestion.correctAnswer || "Desconocido",
                    message: inputMessage,
                    history: history
                })
            });

            if (!response.ok) {
                throw new Error('Error al obtener pista');
            }

            const data = await response.json();

            // Añadir respuesta del asistente
            setMessages([...newMessages, {
                role: 'assistant',
                content: data.response
            }]);

        } catch (error) {
            console.error('Error obteniendo pista:', error);
            setMessages([...newMessages, {
                role: 'assistant',
                content: 'Lo siento, hubo un error al obtener la pista. Por favor, intenta de nuevo.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!open) return null;

    return (
        <Fade in={open}>
            <Paper
                elevation={8}
                sx={{
                    position: 'fixed',
                    bottom: 80,
                    right: 20,
                    width: 380,
                    height: 500,
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1300,
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        padding: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                        Asistente de Pistas
                    </Typography>
                    <Button
                        size="small"
                        onClick={onClose}
                        sx={{ color: 'white', minWidth: 'auto' }}
                    >
                        X
                    </Button>
                </Box>

                {/* Messages Area */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 2,
                        backgroundColor: '#f5f5f5'
                    }}
                >
                    {messages.length === 0 && (
                        <Box sx={{ textAlign: 'center', marginTop: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                ¡Hola! Pregúntame lo que quieras sobre la imagen.
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', marginTop: 1 }}>
                                Ejemplos: "¿Dónde está?", "Dame una pista", "¿Qué características tiene?"
                            </Typography>
                        </Box>
                    )}

                    <List sx={{ padding: 0 }}>
                        {messages.map((message, index) => (
                            <ListItem
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                                    padding: '4px 0',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                                        alignItems: 'flex-start',
                                        gap: 1,
                                        maxWidth: '85%'
                                    }}
                                >
                                    {/* Avatar Text */}
                                    <Box
                                        sx={{
                                            minWidth: 32,
                                            minHeight: 32,
                                            borderRadius: '50%',
                                            backgroundColor: message.role === 'user'
                                                ? 'primary.main'
                                                : 'secondary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {message.role === 'user' ? 'TÚ' : 'AI'}
                                    </Box>

                                    {/* Message Bubble */}
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            padding: 1.5,
                                            backgroundColor: message.role === 'user'
                                                ? 'primary.light'
                                                : 'white',
                                            color: message.role === 'user' ? 'white' : 'text.primary',
                                            borderRadius: 2,
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {message.content}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </ListItem>
                        ))}

                        {loading && (
                            <ListItem sx={{ justifyContent: 'flex-start', padding: '4px 0' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            minWidth: 32,
                                            minHeight: 32,
                                            borderRadius: '50%',
                                            backgroundColor: 'secondary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        AI
                                    </Box>
                                    <CircularProgress size={20} />
                                    <Typography variant="body2" color="text.secondary">
                                        Pensando...
                                    </Typography>
                                </Box>
                            </ListItem>
                        )}
                    </List>
                    <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Box
                    sx={{
                        padding: 2,
                        backgroundColor: 'white',
                        borderTop: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            inputRef={inputRef}
                            fullWidth
                            size="small"
                            placeholder="Escribe tu pregunta..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading || !currentQuestion}
                            multiline
                            maxRows={3}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || loading || !currentQuestion}
                            sx={{ minWidth: 'auto', px: 2 }}
                        >
                            →
                        </Button>
                    </Box>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', marginTop: 0.5 }}
                    >
                        Presiona Enter para enviar
                    </Typography>
                </Box>
            </Paper>
        </Fade>
    );
}

export default HintChat;