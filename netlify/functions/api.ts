import { app } from '../../server/app.js'

// Mesma API da Vercel (api/index.ts). O Hono já responde em /api, então o caminho é o inteiro.
export default (request: Request) => app.fetch(request)

export const config = { path: '/api/*' }
