import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AddUser from './AddUser';

const mockAxios = new MockAdapter(axios);

describe('AddUser component', () => {
    beforeEach(() => {
        mockAxios.reset();
    });

    test('renders register form', () => {
        render(<AddUser />);
        expect(screen.getByTestId('register-username-input')).toBeInTheDocument();
        expect(screen.getByTestId('register-password-input')).toBeInTheDocument();
    });

    test('successful registration', async () => {
        render(<AddUser />);

        mockAxios.onPost('http://localhost:8000/adduser').reply(200);

        fireEvent.change(screen.getByTestId('register-username-field'), { target: { value: 'newuser' } });
        fireEvent.change(screen.getByTestId('register-password-field'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByTestId('register-confirm-password-field'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByTestId('register-submit-button'));

        await waitFor(() => {
            expect(screen.getByTestId('register-success-message')).toBeInTheDocument();
        });
    });
});