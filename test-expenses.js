const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Testing Expenses Database Connection...')
    try {
        const expenses = await prisma.expense.findMany({
            take: 5,
            orderBy: { date: 'desc' }
        })
        console.log('Successfully fetched expenses:', expenses)
        console.log('Count:', expenses.length)
    } catch (e) {
        console.error('DB ERROR:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
