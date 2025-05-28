import { useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./supabase-client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";


const App = () => {
  const [session, setSession] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  console.log(session);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />;
  } else {
    return (
      <div>
        <h2>Welcome, {session?.user?.user_metadata?.full_name}</h2>
        {session?.user?.user_metadata?.picture && (
          <img
            src={session.user.user_metadata.picture}
            alt="User"
            style={{ width: 100, borderRadius: "50%" }}
          />
        )}
        <button onClick={handleSignOut}>Sign Out</button>
      </div>
    );
  }
};

export default App;
