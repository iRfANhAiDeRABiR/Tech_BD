"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export interface AddressInput {
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function addAddress(input: AddressInput): Promise<{ ok: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  if (!input.fullName.trim() || !input.phone.trim() || !input.addressLine1.trim() || !input.city.trim()) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  try {
    const existingCount = await prisma.address.count({ where: { userId } });
    const makeDefault = input.isDefault || existingCount === 0;

    if (makeDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    await prisma.address.create({
      data: {
        userId,
        label: input.label?.trim() || null,
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        addressLine1: input.addressLine1.trim(),
        addressLine2: input.addressLine2?.trim() || null,
        city: input.city.trim(),
        state: input.state?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        country: input.country?.trim() || "Bangladesh",
        isDefault: makeDefault,
      },
    });

    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (error) {
    console.error("Failed to add address", error);
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Could not save the address: ${message}` };
  }
}

export async function deleteAddress(addressId: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  try {
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      return { ok: false, error: "Address not found." };
    }

    await prisma.address.delete({ where: { id: addressId } });

    // If the deleted one was default, promote another
    if (address.isDefault) {
      const next = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
      if (next) {
        await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }

    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete address", error);
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Could not delete the address: ${message}` };
  }
}

export async function setDefaultAddress(addressId: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  try {
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      return { ok: false, error: "Address not found." };
    }

    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
      prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
    ]);

    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (error) {
    console.error("Failed to set default address", error);
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Could not update the default address: ${message}` };
  }
}