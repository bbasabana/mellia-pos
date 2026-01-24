
import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from './src/lib/auth';

// Use the production URL provided by the user
const connectionString = "postgresql://neondb_owner:npg_Z4onQiCXqpe0@ep-lingering-forest-ahfzktc8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: connectionString,
        },
    },
});

async function main() {
    console.log("🔍 Diagnosing Auth on Remote DB...");
    const email = "admin@mellia.pos";
    const passwordToCheck = "Admin123!";

    try {
        // 1. Check User Existence
        console.log(`\n1. Searching for user: ${email}`);
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error("❌ User NOT FOUND in production database.");
            console.log("   -> You need to run the seed script on production.");
            return;
        }

        console.log(`✅ User found: ID=${user.id}, Role=${user.role}, Status=${user.status}`);

        // 2. Check Password
        console.log(`\n2. Verifying password: '${passwordToCheck}'`);
        const isValid = await verifyPassword(passwordToCheck, user.passwordHash);

        if (isValid) {
            console.log("✅ Password verification SUCCEEDED.");
            console.log("   -> The credentials in DB are correct. The issue might be in the Vercel env vars or deployment.");
        } else {
            console.error("❌ Password verification FAILED.");
            console.log("   -> The stored hash does not match 'Admin123!'");

            // Generate new hash for comparison
            const newHash = await hashPassword(passwordToCheck);
            console.log(`   -> Expected hash for 'Admin123!' would look like: ${newHash.substring(0, 10)}...`);
            console.log(`   -> Actual stored hash starts with: ${user.passwordHash.substring(0, 10)}...`);
        }

    } catch (error) {
        console.error("🚨 Error during diagnosis:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
