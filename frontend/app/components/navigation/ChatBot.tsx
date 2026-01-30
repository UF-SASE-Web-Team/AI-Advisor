import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

interface UserInfo {
  full_name: string;
  avatar_url?: string;
}

export default function ChatBotBar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin, // redirect
      },
    });
    if (error) console.error("Google sign-in error:", error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const metadata: UserInfo = {
    full_name: user?.user_metadata?.full_name || user?.email || "Guest",
    avatar_url: user?.user_metadata?.avatar_url,
  };

  const buttonStyle = {
    padding: "8px 16px",
    cursor: "pointer",
    borderRadius: "6px",
    border: "none",
    background: "rgba(106,138,131,1)",
    color: "white",
    fontWeight: 500,
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
      }}
    >
      {!user ? (
        <button
          onClick={loginWithGoogle}
          title="Login with your Google account"
          style={buttonStyle}
        >
          Login with Google
        </button>
      ) : (
        <>
          <img
            src={metadata.avatar_url || "/default-avatar.png"}
            alt="avatar"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid #ccc",
            }}
          />
          <span style={{ color: "white" }}>{metadata.full_name}</span>
          <button
            onClick={logout}
            title="Sign out"
            style={buttonStyle}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}