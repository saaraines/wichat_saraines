import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import axios from 'axios';

function QuestionManagement({ onBack }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [category, setCategory] = useState('Capitales');
    const [generating, setGenerating] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    const categories = [
        'Capitales',
        'Banderas',
        'Monumentos'
    ];

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(`${apiEndpoint}/admin/questions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setQuestions(response.data);
            setLoading(false);
        } catch (error) {
            setError('Error al cargar preguntas');
            setLoading(false);
            console.error(error);
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            setError('');
            setSuccess('');
            const token = localStorage.getItem('token');

            const response = await axios.post(
                `${apiEndpoint}/admin/questions/generate`,
                { category: category, count: 10 },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setSuccess(response.data.message);
            setGenerating(false);
            fetchQuestions();
        } catch (error) {
            setError('Error al generar preguntas');
            setGenerating(false);
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            await axios.delete(
                `${apiEndpoint}/admin/questions/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setSuccess('Pregunta eliminada correctamente');
            fetchQuestions();
        } catch (error) {
            setError('Error al eliminar pregunta');
            console.error(error);
        }
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    const handleCloseImage = () => {
        setSelectedImage(null);
    };

    if (loading) {
        return (
            <Container sx={{ marginTop: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container sx={{ marginTop: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <Typography variant="h4">
                    Gestión de Preguntas
                </Typography>
                <Button variant="outlined" onClick={onBack}>
                    Volver
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ marginBottom: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ marginBottom: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* Panel de generación */}
            <Paper sx={{ padding: 3, marginBottom: 3 }}>
                <Typography variant="h6" sx={{ marginBottom: 2 }}>
                    Generar Nuevas Preguntas
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Categoría</InputLabel>
                        <Select
                            value={category}
                            label="Categoría"
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={generating}
                        >
                            {categories.map((cat) => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGenerate}
                        disabled={generating}
                    >
                        {generating ? (
                            <>
                                <CircularProgress size={20} sx={{ marginRight: 1 }} />
                                Generando...
                            </>
                        ) : (
                            'Generar 10 Preguntas'
                        )}
                    </Button>
                </Box>
            </Paper>

            {/* Tabla de preguntas */}
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
                Preguntas Existentes ({questions.length})
            </Typography>

            {questions.length === 0 ? (
                <Alert severity="info">
                    No hay preguntas generadas. Usa el panel superior para generar algunas.
                </Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Imagen</strong></TableCell>
                                <TableCell><strong>Pregunta</strong></TableCell>
                                <TableCell><strong>Respuesta Correcta</strong></TableCell>
                                <TableCell><strong>Categoría</strong></TableCell>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {questions.map((question) => (
                                <TableRow key={question._id} hover>
                                    <TableCell>
                                        <img
                                            src={question.imageUrl}
                                            alt="Question"
                                            style={{
                                                width: 60,
                                                height: 60,
                                                objectFit: 'cover',
                                                cursor: 'pointer',
                                                borderRadius: 4
                                            }}
                                            onClick={() => handleImageClick(question.imageUrl)}
                                        />
                                    </TableCell>
                                    <TableCell>{question.question}</TableCell>
                                    <TableCell>{question.correctAnswer}</TableCell>
                                    <TableCell>{question.category}</TableCell>
                                    <TableCell>
                                        {new Date(question.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            onClick={() => handleDelete(question._id)}
                                        >
                                            Eliminar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Dialog para ver imagen grande */}
            <Dialog open={!!selectedImage} onClose={handleCloseImage} maxWidth="md">
                <DialogTitle>Vista de Imagen</DialogTitle>
                <DialogContent>
                    <img
                        src={selectedImage}
                        alt="Question Large"
                        style={{ width: '100%', height: 'auto' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseImage}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default QuestionManagement;