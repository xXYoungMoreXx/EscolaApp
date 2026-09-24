// Logger minimalista e serverless-safe (logs estruturados no Vercel).
// Mantém a mesma interface usada no código portado (info/warn/error/debug).

type Fields = Record<string, unknown>;

function write(level: 'debug' | 'info' | 'warn' | 'error', fields: Fields, msg?: string) {
  if (level === 'debug' && process.env.LOG_LEVEL === 'silent') return;
  const line = JSON.stringify({ level, msg, ...fields, service: 'escola-app' });
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (fields: Fields, msg?: string) => {
    if (process.env.NODE_ENV === 'development') write('debug', fields, msg);
  },
  info: (fields: Fields, msg?: string) => {
    write('info', fields, msg);
  },
  warn: (fields: Fields, msg?: string) => {
    write('warn', fields, msg);
  },
  error: (fields: Fields, msg?: string) => {
    write('error', fields, msg);
  },
};

export default logger;
