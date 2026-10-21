import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch profile data from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, phone_e164, whatsapp_e164")
    .eq("id", user.id)
    .single();

  // Coerce phone values to strings - the columns may contain numeric values
  const toPhoneString = (value: unknown): string | null => {
    if (value == null) return null;
    return typeof value === "string" ? value : String(value);
  };

  const profileData = {
    id: user.id,
    email: user.email || "",
    emailConfirmedAt: user.email_confirmed_at || null,
    fullName: profile?.full_name || null,
    username: profile?.username || null,
    phoneE164: toPhoneString(profile?.phone_e164),
    whatsappE164: toPhoneString(profile?.whatsapp_e164),
  };

  return <ProfileClient profile={profileData} />;
}