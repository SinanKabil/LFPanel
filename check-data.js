const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const count = await prisma.posTransaction.count()
        console.log(`PosTransaction count: ${count}`)
        const stores = await prisma.lamiaStore.count()
        console.log(`LamiaStore count: ${stores}`)
        const cash = await prisma.cashTransaction.count()
        console.log(`CashTransaction count: ${cash}`)
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
