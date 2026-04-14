import { Request, Response } from 'express'
import { getDashboardStats } from '../services/dashboard.service'

export async function dashboard(req: Request, res: Response) {
  const userId = req.user.id

  const endDate = new Date()
  const startDate = new Date()
  const period = String(req.query.period ?? '30d')

  if (period === '7d') startDate.setDate(startDate.getDate() - 7)
  else if (period === 'month') startDate.setDate(1)
  else startDate.setDate(startDate.getDate() - 30)

  if (req.query.from) startDate.setTime(new Date(String(req.query.from)).getTime())
  if (req.query.to) endDate.setTime(new Date(String(req.query.to)).getTime())

  const data = await getDashboardStats({ userId, startDate, endDate })
  res.json(data)
}
