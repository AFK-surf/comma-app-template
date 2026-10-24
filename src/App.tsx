import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>{name ? `${name}'s notes` : "Notes"}</CardTitle>
          <CardDescription>Kept for you on every device.</CardDescription>
        </div>
        <Link to="/about">About</Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="flex items-end gap-2" onSubmit={add}>
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="new-note">New note</Label>
            <Input
              id="new-note"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a note"
            />
          </div>
          <Button type="submit">Add</Button>
        </form>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <ul aria-label="Notes" className="flex flex-col divide-y">
          {notes.map((note) => (
            <li key={note.id} className="py-2">
              {note.text}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function About() {
  const { back } = useRouter();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{comma.app.name}</CardTitle>
        <CardDescription>Version {comma.app.version}. Made with Comma.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" onClick={back}>
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
