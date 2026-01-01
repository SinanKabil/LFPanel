const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Seeding passwords to 'Sinan123'...")

    const p1 = await prisma.appConfig.upsert({
        where: { key: 'PASSWORD_ETSY' },
        update: { value: 'Sinan123' },
        create: { key: 'PASSWORD_ETSY', value: 'Sinan123' }
    })

    const p2 = await prisma.appConfig.upsert({
        where: { key: 'PASSWORD_LAMIAFERIS' },
        update: { value: 'Sinan123' },
        create: { key: 'PASSWORD_LAMIAFERIS', value: 'Sinan123' }
    })

    console.log("Passwords set:", p1, p2)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
