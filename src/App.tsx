import { useEffect, useState, type FormEvent } from "react";
import { comma, CommaError } from "./comma/sdk";
import { Link, Routes, useRouter } from "./router";

interface Note {
  id: string;
  text: string;
}

// The viewer's notes, on all their devices: one value in the `user` store.
const notesKey = "notes";

export function App() {
  return (
    <main>
      <Routes
        routes={{
          "/": () => <Notes />,
          "/about": () => <About />,
          "*": () => <Notes />,
        }}
      />
    </main>
  );
}

function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [version, setVersion] = useState(0);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    void comma.storage.user.get<Note[]>(notesKey).then((stored) => {
      setNotes(stored?.value ?? []);
      setVersion(stored?.version ?? 0);
    }, report);
    if (comma.supports("viewer"))
      void comma.viewer().then((viewer) => setName(viewer.name), report);
  }, []);

  function report(reason: unknown) {
    setError(
      reason instanceof CommaError
        ? `${reason.code}: ${reason.message}`
        : String(reason)
    );
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const next = [...notes, { id: `${Date.now().toString(36)}-${notes.length}`, text }];
    try {
      // `ifVersion` refuses the write when another device changed the notes.
      const saved = await comma.storage.user.put(notesKey, next, {
        ifVersion: version,
      });
      setNotes(next);
      setVersion(saved.version);
      setDraft("");
      setError(null);
    } catch (reason) {
      report(reason);
    }
  }

  return (
    <section className="stack">
      <header className="row">
        <h1>{name ? `${name}'s notes` : "Notes"}</h1>
        <Link to="/about">About</Link>
      </header>
      <form className="row" onSubmit={add}>
        <input
          aria-label="New note"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a note"
        />
        <button type="submit">Add</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <ul aria-label="Notes">
        {notes.map((note) => (
          <li key={note.id}>{note.text}</li>
        ))}
      </ul>
    </section>
  );
}

function About() {
  const { back } = useRouter();
  return (
    <section className="stack">
      <h1>{comma.app.name}</h1>
      <p>Version {comma.app.version}. Made with Comma.</p>
      <button type="button" onClick={back}>
        Back
      </button>
    </section>
  );
}
