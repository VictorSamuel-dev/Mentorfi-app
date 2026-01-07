import { db } from "../db";
import { badges } from "@shared/schema";
import { eq } from "drizzle-orm";
import { BADGE_SEED, type BadgeSeedData } from "./badges";

export async function seedBadges(): Promise<void> {
  console.log("Checking badges seed...");
  
  for (const badgeData of BADGE_SEED) {
    const existing = await db
      .select()
      .from(badges)
      .where(eq(badges.code, badgeData.code));

    const iconSvg = JSON.stringify(badgeData.iconVariants);

    if (existing.length === 0) {
      await db.insert(badges).values({
        code: badgeData.code,
        name: badgeData.name,
        description: badgeData.description,
        tier: badgeData.tier,
        textColor: badgeData.textColor,
        bgColor: badgeData.bgColor,
        borderColor: badgeData.borderColor,
        iconSvg,
      });
      console.log(`  Created badge: ${badgeData.code}`);
    } else {
      await db
        .update(badges)
        .set({
          name: badgeData.name,
          description: badgeData.description,
          tier: badgeData.tier,
          textColor: badgeData.textColor,
          bgColor: badgeData.bgColor,
          borderColor: badgeData.borderColor,
          iconSvg,
        })
        .where(eq(badges.code, badgeData.code));
      console.log(`  Updated badge: ${badgeData.code}`);
    }
  }

  console.log("Badges seed complete.");
}
