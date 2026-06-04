import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import LoginPage from "./pages/LoginPage";
import NotesPage from "./pages/NotesPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // onAuthStateChanged listens for login/logout events automatically
  // This persists the session across page refreshes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  if (checking) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
        height:"100vh", background:"#0f0f0f", color:"#666", fontFamily:"sans-serif" }}>
        Checking auth state...
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={() => {}} />;
  }

  return <NotesPage user={user} onLogout={() => {}} />;
}