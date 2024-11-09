import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const scholars = [
    { name: 'John Doe', department: 'Computer Science' },
    { name: 'Jane Smith', department: 'Physics' },
  ]

  // Clear existing data
  await prisma.scholar.deleteMany()

  console.log('Seeding...')

  // Insert new data
  for (const scholar of scholars) {
    const createdScholar = await prisma.scholar.create({
      data: scholar
    })
    console.log(`Created scholar with id: ${createdScholar.id}`)
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })