// server/index.js
// Express server using Firebase Admin SDK to verify tokens server-side
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// Load service account key (downloaded from Firebase Console)
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin (server-side SDK — different from client SDK)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

app.use(cors({ origin: "http://localhost:5173" })); // Vite's default port
app.use(express.json());

// Middleware: verify Firebase ID token from Authorization header
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    // Admin SDK verifies the token and returns the decoded user info
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // { uid, email, ... }
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
};

// GET /api/notes — Protected route: returns notes for verified user
app.get("/api/notes", verifyToken, async (req, res) => {
  const snapshot = await db
    .collection("notes")
    .where("userId", "==", req.user.uid)
    .orderBy("createdAt", "desc")
    .get();

  const notes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json(notes);
});

// POST /api/notes — Protected route: create a note
app.post("/api/notes", verifyToken, async (req, res) => {
  const { title, content } = req.body;

  const docRef = await db.collection("notes").add({
    userId: req.user.uid,
    title,
    content,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.json({ id: docRef.id, title, content });
});

app.listen(3001, () => {
  console.log("Server running at http://localhost:3001");
});