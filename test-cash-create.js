const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        // Get a store first
        const store = await prisma.lamiaStore.findFirst()
        if (!store) {
            console.log("No store found to link to.")
            return
        }
        console.log(`Using store: ${store.name} (${store.id})`)

        const tx = await prisma.cashTransaction.create({
            data: {
                date: new Date(),
                amount: 100,
                storeId: store.id,
                note: "Test transaction"
            }
        })
        console.log("Created:", tx)
    } catch (e) {
        console.error("Error creating cash transaction:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
