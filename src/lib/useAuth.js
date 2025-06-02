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
      console.log(`Checking whitelist for email: ${email}`);
      
      // First try a simple query to see if user exists
      const { data: userExists, error: userExistsError } = await supabase
        .from("user")
        .select("user_id")
        .eq("whitelisted_email", email)
        .maybeSingle();
        
      if (userExistsError) {
        console.error("Error checking if user exists:", userExistsError);
        return false;
      }
      
      if (!userExists) {
        console.warn(`User not found in whitelist: ${email}`);
        return false;
      }
      
      // If user exists, fetch the full details
      const { data, error } = await supabase
        .from("user")
        .select("whitelisted_email, org_id, organization(org_code, org_name)")
        .eq("whitelisted_email", email)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching user details for ${email}:`, error);
        return false;
      }

      if (!data) {
        console.warn(`No data returned for whitelisted email: ${email}`);
        return false;
      }

      // Log the data for debugging
      console.log('[Whitelist] Found user data:', data);
      return data; // return the full record for later use
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
        console.log("User metadata:", user.user_metadata);
        const whitelistData = await checkWhitelist(user.email);
        
        if (whitelistData) {
          setUser({ 
            ...user, 
            org_id: whitelistData.org_id, // Add org_id directly to user object
            organization: whitelistData.organization, 
            avatar_url: user.user_metadata?.picture
          });
          
          console.log('User data after whitelist:', {
            org_id: whitelistData.org_id,
            organization: whitelistData.organization
          });
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
    } catch (error) {
      console.error("Error handling user session:", error);
      setUser(null);
      setIsAuthorized(false);
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
