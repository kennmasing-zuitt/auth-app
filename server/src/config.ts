function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("MONGO_URI"),
  jwtSecret: required("JWT_SECRET"),
  // How long a login session lasts (JWT + cookie), in seconds
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 3600),
  // Set to "true" in production (HTTPS behind Nginx) so the cookie is only sent over TLS
  cookieSecure: process.env.COOKIE_SECURE === "true",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
};
