import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { vendorCorrections } from "@/db/schema";

/**
 * Shared, cross-user OCR learning. When any user corrects a vendor name
 * OCR got wrong, that correction is saved here keyed on the receipt's
 * Swedish org number ("556677-8899") — a fixed, OCR-reliable identifier
 * that's the same for every receipt from that company, regardless of how
 * garbled the store's stylized logo/name comes out in any given photo.
 *
 * Once one person corrects "net te" -> "Netto" for org number
 * 556677-8899, EVERY future receipt from that same company — for any
 * user, any company account — gets the right name automatically. This is
 * what makes the system improve at the scale of "every Swedish company
 * that exists" without a paid API or a hand-maintained store list: the
 * userbase itself builds the list over time.
 */

/**
 * Records that a person corrected OCR's vendor guess. Safe to call even
 * when nothing actually changed — recordCorrection only writes when the
 * corrected value differs from what OCR produced.
 */
export async function recordVendorCorrection(params: {
  orgNumber?: string | null;
  ocrGuess?: string | null;
  correctVendor: string;
  basCode?: string | null;
}): Promise<void> {
  const { orgNumber, ocrGuess, correctVendor, basCode } = params;
  const trimmedCorrect = correctVendor.trim();
  if (!trimmedCorrect) return;
  // Nothing to learn if the person didn't actually change anything.
  if (ocrGuess && ocrGuess.trim().toLowerCase() === trimmedCorrect.toLowerCase()) return;
  // Need at least one stable key to learn from.
  if (!orgNumber && !ocrGuess) return;

  try {
    if (orgNumber) {
      // Upsert by org number: if this org number was corrected before,
      // bump its confirmation count rather than creating a duplicate row
      // (multiple users independently agreeing on the same correction is
      // itself a useful signal, even though we don't currently rank by it).
      const [existing] = await db
        .select()
        .from(vendorCorrections)
        .where(eq(vendorCorrections.orgNumber, orgNumber))
        .limit(1);
      if (existing) {
        await db
          .update(vendorCorrections)
          .set({
            correctVendor: trimmedCorrect,
            basCode: basCode ?? existing.basCode,
            timesConfirmed: sql`${vendorCorrections.timesConfirmed} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(vendorCorrections.id, existing.id));
        return;
      }
    }
    await db.insert(vendorCorrections).values({
      orgNumber: orgNumber ?? null,
      ocrText: ocrGuess ? ocrGuess.slice(0, 300) : null,
      correctVendor: trimmedCorrect,
      basCode: basCode ?? null,
    });
  } catch (e) {
    // Learning is a nice-to-have layered on top of the regex parser —
    // never let a failure here block the person from saving their receipt.
    console.error("recordVendorCorrection failed (non-blocking):", e);
  }
}

/**
 * Looks up a learned correction. Org number match is exact and authoritative
 * (it's a fixed identifier, not fuzzy text) — checked first. Falls back to
 * an exact OCR-text match for receipts where no org number was readable
 * (less powerful, since OCR noise varies photo to photo, but still catches
 * the same camera/lighting producing the same garbled text twice).
 */
export async function lookupVendorCorrection(params: {
  orgNumber?: string | null;
  ocrGuess?: string | null;
}): Promise<{ vendorName: string; basCode: string | null } | null> {
  const { orgNumber, ocrGuess } = params;
  try {
    if (orgNumber) {
      const [byOrg] = await db
        .select()
        .from(vendorCorrections)
        .where(eq(vendorCorrections.orgNumber, orgNumber))
        .limit(1);
      if (byOrg) return { vendorName: byOrg.correctVendor, basCode: byOrg.basCode };
    }
    if (ocrGuess && ocrGuess.trim()) {
      const [byText] = await db
        .select()
        .from(vendorCorrections)
        .where(eq(vendorCorrections.ocrText, ocrGuess.trim().slice(0, 300)))
        .limit(1);
      if (byText) return { vendorName: byText.correctVendor, basCode: byText.basCode };
    }
  } catch (e) {
    console.error("lookupVendorCorrection failed (non-blocking):", e);
  }
  return null;
}
