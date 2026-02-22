export const generateSecret = jest.fn().mockReturnValue('MOCK_SECRET_BASE32');

export const generateURI = jest.fn().mockReturnValue('otpauth://totp/DermaConsent:test@test.com?secret=MOCK_SECRET_BASE32&issuer=DermaConsent');

export const verifySync = jest.fn().mockReturnValue({ valid: true, delta: 0 });
