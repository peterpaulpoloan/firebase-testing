// LoginPage.jsx
// Demonstrates: createUserWithEmailAndPassword, signInWithEmailAndPassword
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // --- REGISTER ---
        // Firebase creates a user and returns a UserCredential
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Save extra user info to Firestore (Auth only stores email/uid)
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: email.split("@")[0],   // default display name
          createdAt: serverTimestamp(),
        });

      } else {
        // --- LOGIN ---
        await signInWithEmailAndPassword(auth, email, password);
      }

      onLogin(); // Navigate to notes page
    } catch (err) {
      // Firebase returns error codes like "auth/wrong-password"
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🔥</div>
          <h1>Firebase Notes</h1>
          <p>A teaching demo for Firebase Auth + Firestore</p>
        </div>

        <div className="login-toggle">
          <button
            className={!isRegister ? "active" : ""}
            onClick={() => setIsRegister(false)}
          >
            Sign In
          </button>
          <button
            className={isRegister ? "active" : ""}
            onClick={() => setIsRegister(true)}
          >
            Register
          </button>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Loading..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </div>

        <div className="firebase-note">
          <strong>What's happening:</strong>
          <ul>
            <li>Auth via <code>firebase/auth</code></li>
            <li>User doc saved to <code>firestore/users</code></li>
            <li>UID links Auth ↔ Firestore</li>
          </ul>
        </div>
      </div>
    </div>
  );
}