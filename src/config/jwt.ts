// ============================================================
// CONFIGURAÇÃO JWT
// ============================================================

export const jwtConfig = {
  secret: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET não definido no .env') })(),
  expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',

  // Cookie httpOnly — nunca acessível via JS no browser (proteção XSS)
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS apenas em prod
    sameSite: 'strict' as const,
    maxAge: 8 * 60 * 60 * 1000, // 8h em ms
  },

  refreshCookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/api/auth/refresh', // cookie de refresh só vai nessa rota
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
  },
}
