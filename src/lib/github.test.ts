// src/lib/github.test.ts
import jwt from 'jsonwebtoken';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ token: 'mock_token' }),
  })
) as jest.Mock;

const originalEnv = process.env;

describe('getInstallationAccessToken', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      GITHUB_APP_ID: '12345',
      GITHUB_APP_PRIVATE_KEY: 'test_key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create a JWT with a 10-minute expiration', async () => {
    const sign = jest.fn();
    jest.doMock('jsonwebtoken', () => ({
        ...jest.requireActual('jsonwebtoken'),
        sign,
    }));

    const { getInstallationAccessToken } = require('./github');
    const installationId = '12345';
    const now = Math.floor(Date.now() / 1000);
    jest.spyOn(Date, 'now').mockImplementation(() => now * 1000);

    await getInstallationAccessToken(installationId);

    expect(sign).toHaveBeenCalledWith(
      {
        iat: now,
        exp: now + 600, // 10 minutes
        iss: '12345',
      },
      'test_key',
      { algorithm: 'RS256' }
    );
  });
});
