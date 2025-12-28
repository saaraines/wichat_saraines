import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Login from './Login';

const mockAxios = new MockAdapter(axios);

delete window.location;
window.location = { href: '' };

describe('Login component', () => {
    beforeEach(() => {
        mockAxios.reset();
        localStorage.clear();
    });

    test('renders login form', () => {
        render(<Login />);
        expect(screen.getByTestId('login-username-input')).toBeInTheDocument();
        expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    });

    test('successful login', async () => {
        render(<Login />);

        mockAxios.onPost('http://localhost:8000/login').reply(200, {
            token: 'token',
            username: 'user',
            role: 'user'
        });

        fireEvent.change(screen.getByTestId('login-username-field'), { target: { value: 'user' } });
        fireEvent.change(screen.getByTestId('login-password-field'), { target: { value: 'pass123' } });
        fireEvent.click(screen.getByTestId('login-submit-button'));

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe('token');
        });
    });
});