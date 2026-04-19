/**
 * Настройки пула PostgreSQL из переменных окружения.
 * @returns {false | { rejectUnauthorized: boolean }}
 */
function getPgSslConfig() {
  const mode = (process.env.DATABASE_SSL ?? "true").toLowerCase();
  if (mode === "false" || mode === "0" || mode === "disable" || mode === "off") {
    return false;
  }
  return {
    rejectUnauthorized:
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
  };
}

/**
 * Опции для `new Pool(...)` или совместимого клиента.
 * @returns {object | null} null если нет DATABASE_URL
 */
function getPoolOptions() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  const ssl = getPgSslConfig();
  return {
    connectionString,
    ...(ssl ? { ssl } : {}),
    connectionTimeoutMillis:
      Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS) || 60_000,
    idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS) || 60_000,
    statementTimeoutMillis:
      Number(process.env.DATABASE_STATEMENT_TIMEOUT_MS) || 30_000,
    max: Number(process.env.DATABASE_POOL_MAX) || 5,
  };
}

module.exports = { getPgSslConfig, getPoolOptions };
