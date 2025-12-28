import { render } from '@testing-library/react';
import WelcomePage from './WelcomePage';

test('renders welcome page', () => {
    const { container } = render(<WelcomePage />);
    expect(container).toBeTruthy();
});