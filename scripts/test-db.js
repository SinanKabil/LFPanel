// scripts/test-db.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    console.log("Testing database connection...")
    console.log("URL:", process.env.DATABASE_URL?.replace(/:[^:@]*@/, ":****@")) // Hide password in log

    try {
        await prisma.$connect()
        console.log("✅ Successfully connected to the database!")

        const count = await prisma.user?.count() || 0
        console.log(`Test Query successful.`)

    } catch (e) {
        console.error("❌ Connection failed:")
        console.error(e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
