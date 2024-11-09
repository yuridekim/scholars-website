// server/src/routes/scholars.ts
import { prisma } from '../lib/prisma'
import { Router } from 'express'

const router = Router()

router.get('/api/scholars', async (req, res) => {
  try {
    const scholars = await prisma.scholar.findMany()
    res.json(scholars)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scholars' })
  }
})

export default router