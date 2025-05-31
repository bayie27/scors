import { useState, useEffect, useCallback } from "react"
import { supabase } from "../supabase-client.js";

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  const checkWhitelist = async (email) => {
    try {
      const { data, error } = await supabase
        .from("user")
        .select("whitelisted_email, org_id, organization(org_code, org_name)")
        .eq("whitelisted_email", email);

      if (error || !data || data.length === 0) {
        console.warn(`Whitelist check failed for email: ${email}`);
        return false;
      }

      // Log the data for debugging
      console.log('[Whitelist] Found user data:', data[0]);
      return data[0]; // return the full record for later use
    } catch (err) {
      console.error("Unexpected error in checkWhitelist:", err);
      return false;
    }
  };


  const handleUserSession = useCallback(async (session) => {
    const user = session?.user;
    if (user) {
      console.log("User metadata:", user.user_metadata);
      const whitelistData = await checkWhitelist(user.email);
      if (whitelistData) {
        setUser({ 
          ...user, 
          organization: whitelistData.organization, 
          avatar_url: user.user_metadata?.picture
        });
        setIsAuthorized(true);
      } else {
        await supabase.auth.signOut();
      }
    } else {
      setUser(null);
      setIsAuthorized(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await handleUserSession(session);
      } catch (error) {
        console.error("Error during authentication initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleUserSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
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
