// jest.setup.js
import '@testing-library/jest-dom';

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.png',
      },
      expires: '1',
    },
    status: 'authenticated',
  }),
}));
