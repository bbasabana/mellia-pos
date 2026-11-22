/**
 * Restore an administrator account.
 *
 * Creates the admin if the e-mail is unknown, otherwise puts it back to ADMIN + ACTIVE
 * and sets the new password. Touches nothing else in the database.
 *
 * Usage (the database is the one in DATABASE_URL / DIRECT_URL of the .env loaded):
 *   npx tsx scripts/reset-admin.ts <email> <password> [name]
 *
 * Example:
 *   npx tsx scripts/reset-admin.ts admin@mellia.pos 'MonNouveauMotDePasse!' Admin
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const [rawEmail, password, name = "Admin"] = process.argv.slice(2);
  const email = rawEmail?.toLowerCase().trim();

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/reset-admin.ts <email> <password> [name]");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Le mot de passe doit faire au moins 8 caractères.");
    process.exit(1);
  }

  const url = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  const host = url.replace(/^.*@/, "").replace(/[/?].*$/, "") || "(inconnu)";
  console.log(`Base de données : ${host}`);

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "ADMIN", status: "ACTIVE" },
      create: { email, name, passwordHash, role: "ADMIN", status: "ACTIVE" },
    });

    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: "ADMIN_RESET",
          entity: "User",
          entityId: user.id,
          metadata: { via: "scripts/reset-admin.ts", at: new Date().toISOString() },
        },
      })
      .catch(() => undefined);

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, status: true },
    });
    console.log(`✅ Admin prêt : ${user.email} (${user.role}, ${user.status})`);
    console.log(`   Admins dans la base : ${admins.map((a) => `${a.email} [${a.status}]`).join(", ")}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("❌ Échec :", error.message || error);
  process.exit(1);
});
