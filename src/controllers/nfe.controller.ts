import { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  nfeSchema,
  createNfe as createNfeService,
  listNfes as listNfesService,
} from '../services/nfe.service'

// ---- Configuração Multer (PDFs até 5 MB) ----

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (_req, _file, cb) => cb(null, `${randomUUID()}.pdf`),
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true)
    cb(new Error('Apenas arquivos PDF são permitidos.'))
  },
})

// ---- Handlers ----

export const createNfe = [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upload.single('pdf') as any,
  async (req: Request, res: Response) => {
    const parsed = nfeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message })
      return
    }

    const pdfPath = req.file ? req.file.filename : undefined
    const nfe = await createNfeService(req.user.id, parsed.data, pdfPath)
    res.status(201).json(nfe)
  },
]

export async function listNfes(req: Request, res: Response) {
  const nfes = await listNfesService(req.user.id)
  res.json({ nfes })
}
