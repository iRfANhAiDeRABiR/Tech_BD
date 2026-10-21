"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/toast";
import type { Session, User } from "@supabase/supabase-js";

interface Profile {
  username: string | null;
}

export function AuthButton() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user and profile
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();
          
          setProfile(data);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Re-fetch profile on auth change
        supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single()
          .then(({ data }: { data: Profile | null }) => setProfile(data));
      } else {
        setProfile(null);
      }
      setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    notify.info("Signed out", {
      description: "You have been logged out successfully.",
      id: "auth-signout",
    });
    router.refresh();
  };

  if (isLoading) {
    return <div className="auth-btn-placeholder" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        className="btn btn--outline auth-login-btn"
        onClick={() => {
          // Dispatch custom event to open auth modal
          window.dispatchEvent(new CustomEvent("techbd:open-auth-modal", { detail: { mode: "login" } }));
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Login</span>
      </button>
    );
  }

  const displayName = profile?.username || user.email?.split("@")[0] || "Account";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="auth-user-menu" ref={dropdownRef}>
      <button
        type="button"
        className="auth-user-trigger"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <span className="auth-avatar" aria-hidden="true">{initial}</span>
        <span className="auth-username">{displayName}</span>
        <svg 
          className={`auth-chevron ${isDropdownOpen ? "rotated" : ""}`} 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="auth-dropdown">
          <div className="auth-dropdown-header">
            <p className="auth-dropdown-name">{displayName}</p>
            <p className="auth-dropdown-email">{user.email}</p>
          </div>
          <div className="auth-dropdown-divider" />
<nav className="auth-dropdown-links">
<button
  type="button"
  className="auth-dropdown-link-btn"
  onClick={() => {
    setIsDropdownOpen(false);
    router.push("/account");
  }}
>
  Dashboard
</button>
</nav>
          <div className="auth-dropdown-divider" />
          <button
            type="button"
            className="auth-logout-btn"
            onClick={handleLogout}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}