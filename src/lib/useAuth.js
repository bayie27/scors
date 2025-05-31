import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "../supabase-client.js";

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const initializedRef = useRef(false)
  const processingAuthChangeRef = useRef(false)

  const checkWhitelist = async (email) => {
    try {
      const { data, error } = await supabase
        .from("user")
        .select("whitelisted_email")
        .eq("whitelisted_email", email);

      if (error || !data || data.length === 0) {
        console.warn(`Whitelist check failed for email: ${email}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Unexpected error in checkWhitelist:", err);
      return false;
    }
  };

  const handleUserSession = useCallback(async (session) => {
    // Prevent concurrent handling of auth changes
    if (processingAuthChangeRef.current) return;
    
    processingAuthChangeRef.current = true;
    try {
      const user = session?.user;
      if (user) {
        const isWhitelisted = await checkWhitelist(user.email);
        if (isWhitelisted) {
          setUser(user);
          setIsAuthorized(true);
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setIsAuthorized(false);
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
      }
    } finally {
      processingAuthChangeRef.current = false;
      // Only set loading to false after initial check
      if (!initializedRef.current) {
        initializedRef.current = true;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Skip setup if already initialized
    if (initializedRef.current) return;
    
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await handleUserSession(session);
      } catch (error) {
        console.error("Error during authentication initialization:", error);
        setLoading(false);
        initializedRef.current = true;
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (initializedRef.current) {
          await handleUserSession(session);
        }
      }
    );

    return () => {
      if (listener?.subscription?.unsubscribe) {
        listener.subscription.unsubscribe();
      }
    };
  }, [handleUserSession])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          prompt: "select_account"
        }
      }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAuthorized(false)
  }

  return { user, isAuthorized, loading, signInWithGoogle, signOut }
}
