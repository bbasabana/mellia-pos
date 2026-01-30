
import { prisma } from "@/lib/prisma";

async function inspect() {
    const id = "mt3riw"; // Part of the ID from screenshot
    const inv = await prisma.investment.findFirst({
        where: { id: { endsWith: id } },
        include: { movements: true }
    });

    console.log("INVESTMENT DATA:");
    console.log(JSON.stringify(inv, null, 2));
}

inspect();
