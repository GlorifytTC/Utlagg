import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  companyVehicles,
  MILEAGE_RATE_PER_KM,
  COMPANY_CAR_RATE_FOSSIL,
  COMPANY_CAR_RATE_ELECTRIC,
} from "@/db/schema";

/** Resolve the correct Skatteverket rate for a trip given an optional vehicle. */
export async function rateForVehicle(
  vehicleId?: string | null,
): Promise<{ rate: number; vehicleId: string | null }> {
  if (!vehicleId) return { rate: MILEAGE_RATE_PER_KM, vehicleId: null };
  const [v] = await db
    .select()
    .from(companyVehicles)
    .where(eq(companyVehicles.id, vehicleId))
    .limit(1);
  if (!v) return { rate: MILEAGE_RATE_PER_KM, vehicleId: null };
  return {
    rate: v.isElectric ? COMPANY_CAR_RATE_ELECTRIC : COMPANY_CAR_RATE_FOSSIL,
    vehicleId: v.id,
  };
}
