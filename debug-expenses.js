
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Fetching expenses with 'Etsy Ads' in category...")
        const expenses = await prisma.expense.findMany({
            where: {
                category: {
                    contains: 'Etsy Ads',
                    mode: 'insensitive'
                }
            }
        })

        console.log(`Found ${expenses.length} expenses.`)
        let totalTL = 0
        expenses.forEach(e => {
            console.log(`ID: ${e.id}, Date: ${e.date}, Category: ${e.category}, AmountTL: ${e.amountTL}, AmountUSD: ${e.amountUSD}`)
            if (e.amountTL) totalTL += e.amountTL
        })
        console.log(`Calculated Total TL: ${totalTL}`)

        // Also check all categories just in case
        console.log("\nChecking all distinct categories:")
        const allExpenses = await prisma.expense.findMany({})
        const categories = new Set(allExpenses.map(e => e.category))
        console.log(Array.from(categories))

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
