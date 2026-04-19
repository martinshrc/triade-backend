import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import router from './routes'
import { errorHandler } from './middlewares/error.middleware'

const app = express()

// Necessário para rate-limit e IPs reais atrás do Traefik/proxy
app.set('trust proxy', 1)

// Headers de segurança HTTP
app.use(helmet({ crossOriginResourcePolicy: false }))

const rawOrigins = process.env.ALLOWED_ORIGINS ?? ''
const productionOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim())
  .filter((o) => o.length > 0)

if (process.env.NODE_ENV === 'production' && productionOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS não definido no .env de produção. Abortando.')
}

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? productionOrigins
    : ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:8080']

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie')
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

app.use(express.json())
app.use(cookieParser())

app.use('/api', router)
app.use(errorHandler)

const PORT = Number(process.env.PORT ?? 3333)
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`)
  console.log(`   Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
})
