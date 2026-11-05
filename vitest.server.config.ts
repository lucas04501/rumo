import { defineConfig } from 'vitest/config'

// Estes testes usam o banco de verdade da branch dev, definido no .env.
// A conexão da branch principal não fica neste computador.
process.loadEnvFile('.env')

export default defineConfig({
  test: {
    include: ['server/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      TZ: 'America/Sao_Paulo',
      BETTER_AUTH_URL: 'http://localhost:8787',
      // O `.env` local pode ter a cobrança ligada. Os testes partem dela desligada, e os
      // de plano e cobrança ligam onde precisam: o resultado não depende do `.env`.
      BILLING_ENABLED: 'false',
    },
  },
})
