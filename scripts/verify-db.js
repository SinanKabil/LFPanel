const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Verifying functionality...')
        // Try to count items in each table to ensure they exist
        const admins = await prisma.admin.count()
        const products = await prisma.product.count()
        const sales = await prisma.sale.count()
        const expenses = await prisma.expense.count()
        const messages = await prisma.message.count()

        console.log('Tables verified successfully!')
        console.log({ admins, products, sales, expenses, messages })
    } catch (e) {
        console.error('Error verifying tables:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
