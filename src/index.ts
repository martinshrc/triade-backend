import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './routes'
import { errorHandler } from './middlewares/error.middleware'

const app = express()

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:4173']

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // necessário para enviar cookies cross-origin
}))

app.use(express.json())
app.use(cookieParser())

app.use('/api', router)
app.use(errorHandler)

const PORT = Number(process.env.PORT ?? 3333)
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`)
  console.log(`   Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
})
