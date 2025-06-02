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
      console.log('[Auth] Checking whitelist for email:', email);
      
      // Try exact match first with a simple query to see if user exists
      const { data: userExists, error: userExistsError } = await supabase
        .from("user")
        .select("user_id")
        .eq("whitelisted_email", email)
        .maybeSingle();
        
      if (userExistsError) {
        console.error("Error checking if user exists:", userExistsError);
        return false;
      }
      
      // If exact match found, fetch full details
      if (userExists) {
        const { data, error } = await supabase
          .from("user")
          .select("whitelisted_email, org_id, organization(org_code, org_name)")
          .eq("whitelisted_email", email)
          .maybeSingle();

        if (error) {
          console.error(`Error fetching user details for ${email}:`, error);
          return false;
        }

        if (data) {
          return data; // Return the full record if found
        }
      }
      
      // If no exact match, try case-insensitive match
      console.log('[Auth] No exact match found, trying case-insensitive match');
      let { data, error } = await supabase
        .from("user")
        .select("whitelisted_email, org_id, organization(org_code, org_name)")
        .ilike("whitelisted_email", email);
      
      // If still no match, try the email domain
      if (!data || data.length === 0) {
        const domain = email.split('@')[1];
        console.log('[Auth] No case-insensitive match, checking domain:', domain);
        if (domain === 'dlsl.edu.ph' || domain === 'gmail.com') {
          // For development, allow any dlsl.edu.ph or gmail.com account
          console.log('[Auth] Domain is whitelisted, adding temporary access');
          
          // Attempt to insert user if they don't exist (with CSAO privileges for now)
          const { data: insertData, error: insertError } = await supabase
            .from("user")
            .upsert([
              { whitelisted_email: email, org_id: 1 }
            ])
            .select();
            
          if (insertError) {
            console.error('[Auth] Error adding user to whitelist:', insertError);
          } else {
            console.log('[Auth] Added user to whitelist:', insertData);
            // Return the inserted data or fetch the user record again
            ({ data, error } = await supabase
              .from("user")
              .select("whitelisted_email, org_id, organization(org_code, org_name)")
              .eq("whitelisted_email", email));
          }
        }
      }

      if (error || !data || data.length === 0) {
        console.warn(`[Auth] Whitelist check failed for email: ${email}`);
        return false;
      }

      // Log the data for debugging
      console.log('[Auth] Found user data:', data.length ? data[0] : data);
      return data.length ? data[0] : data; // return the full record for later use
    } catch (err) {
      console.error("[Auth] Unexpected error in checkWhitelist:", err);
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

  // Timeout function to automatically refresh auth after a delay
  const setupAuthTimeout = useCallback(() => {
    const timeoutId = setTimeout(() => {
      console.log('[Auth] Timeout reached, attempting to reload authentication');
      window.location.reload();
    }, 10000); // 10 second timeout
    
    return timeoutId;
  }, []);

  useEffect(() => {
    // Skip setup if already initialized
    if (initializedRef.current) return;
    
    let authTimeoutId = null;
    
    const init = async () => {
      try {
        console.log('[Auth] Initializing authentication');
        authTimeoutId = setupAuthTimeout();
        
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        console.log('[Auth] Got session:', session ? 'Yes' : 'No');
        await handleUserSession(session);
        
        // Clear timeout if successful
        if (authTimeoutId) {
          clearTimeout(authTimeoutId);
          authTimeoutId = null;
        }
      } catch (error) {
        console.error("[Auth] Error during authentication initialization:", error);
        setLoading(false);
        initializedRef.current = true;
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event, 'Session:', session ? 'Yes' : 'No');
        
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
