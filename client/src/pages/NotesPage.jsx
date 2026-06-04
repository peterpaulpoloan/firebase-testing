// NotesPage.jsx
// Demonstrates: addDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import "./NotesPage.css";

export default function NotesPage({ user, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- READ: Fetch notes for current user ---
  const fetchNotes = async () => {
    // query() filters to only this user's notes, ordered by newest first
    const q = query(
      collection(db, "notes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const fetched = snapshot.docs.map((doc) => ({
      id: doc.id,        // Firestore document ID
      ...doc.data(),     // Spread all fields from the document
    }));
    setNotes(fetched);
    setLoading(false);
  };

  useEffect(() => {
    const loadNotes = async () => {
      const q = query(
        collection(db, "notes"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotes(fetched);
      setLoading(false);
    };

    loadNotes();
  }, [user.uid]);

  // --- CREATE: Add a new note ---
  const addNote = async () => {
    if (!title.trim()) return;
    setSaving(true);

    // addDoc auto-generates a document ID
    await addDoc(collection(db, "notes"), {
      userId: user.uid,           // Link to the logged-in user
      title: title.trim(),
      content: content.trim(),
      createdAt: serverTimestamp(), // Server-side timestamp (consistent)
      updatedAt: serverTimestamp(),
    });

    setTitle("");
    setContent("");
    await fetchNotes(); // Refresh the list
    setSaving(false);
  };

  // --- DELETE: Remove a note by document ID ---
  const deleteNote = async (noteId) => {
    await deleteDoc(doc(db, "notes", noteId));
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
    await signOut(auth);
    onLogout();
  };

  return (
    <div className="notes-wrapper">
      <header className="notes-header">
        <div className="notes-brand">
          <span>🔥</span> Firebase Notes
        </div>
        <div className="notes-user">
          <span>{user.email}</span>
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <div className="notes-layout">
        {/* CREATE form */}
        <aside className="notes-sidebar">
          <h2>New Note</h2>
          <div className="form-group">
            <label>Title</label>
            <input
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              placeholder="Write your note..."
              value={content}
              rows={6}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <button className="save-btn" onClick={addNote} disabled={saving}>
            {saving ? "Saving..." : "Save to Firestore"}
          </button>

          <div className="firestore-note">
            <strong>Firestore Operations:</strong>
            <ul>
              <li><code>addDoc</code> — Create</li>
              <li><code>getDocs</code> — Read</li>
              <li><code>updateDoc</code> — Update</li>
              <li><code>deleteDoc</code> — Delete</li>
              <li><code>where</code> — Filter by userId</li>
            </ul>
          </div>
        </aside>

        {/* READ list */}
        <main className="notes-main">
          <h2>My Notes <span className="count">{notes.length}</span></h2>
          {loading ? (
            <p className="status">Loading from Firestore...</p>
          ) : notes.length === 0 ? (
            <p className="status">No notes yet. Create your first one!</p>
          ) : (
            <div className="notes-grid">
              {notes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-card-header">
                    <h3>{note.title}</h3>
                    <button
                      className="delete-btn"
                      onClick={() => deleteNote(note.id)}
                    >
                      ×
                    </button>
                  </div>
                  <p>{note.content || <em>No content</em>}</p>
                  <div className="note-meta">
                    <code>id: {note.id.slice(0, 8)}...</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}