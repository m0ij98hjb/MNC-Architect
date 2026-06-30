"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FIREBASE_ENABLED, auth, db } from "@/lib/firebase/client";
import type { AppUser, Role } from "@/lib/domain/types";
import { uid } from "@/lib/utils";

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string, demoRole?: Role) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);
const DEMO_KEY = "mnc_demo_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      if (FIREBASE_ENABLED && auth) {
        const { onAuthStateChanged } = await import("firebase/auth");
        const { doc, getDoc } = await import("firebase/firestore");
        unsub = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            // Role is stored in Firestore: users/{uid} -> { role, displayName }
            let role: Role = "viewer";
            let displayName = fbUser.displayName ?? fbUser.email ?? "User";
            try {
              if (db) {
                const snap = await getDoc(doc(db, "users", fbUser.uid));
                if (snap.exists()) {
                  const data = snap.data() as { role?: Role; displayName?: string };
                  role = data.role ?? role;
                  displayName = data.displayName ?? displayName;
                }
              }
            } catch {
              /* ignore */
            }
            setUser({ uid: fbUser.uid, email: fbUser.email ?? "", displayName, role, photoURL: fbUser.photoURL ?? undefined });
          } else {
            setUser(null);
          }
          setLoading(false);
        });
      } else {
        // Demo mode
        const raw = typeof window !== "undefined" ? localStorage.getItem(DEMO_KEY) : null;
        if (raw) setUser(JSON.parse(raw));
        setLoading(false);
      }
    })();

    return () => unsub?.();
  }, []);

  const signIn = async (email: string, password: string, demoRole: Role = "super_admin") => {
    if (FIREBASE_ENABLED && auth) {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const demoUser: AppUser = {
        uid: uid("demo"),
        email,
        displayName: email.split("@")[0] || "مستخدم تجريبي",
        role: demoRole,
      };
      localStorage.setItem(DEMO_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
    }
  };

  const signOut = async () => {
    if (FIREBASE_ENABLED && auth) {
      const { signOut: fbSignOut } = await import("firebase/auth");
      await fbSignOut(auth);
    } else {
      localStorage.removeItem(DEMO_KEY);
      setUser(null);
    }
  };

  return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
