
import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

function safeFileName(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const random = Math.random().toString(36).slice(2);
  return `${Date.now()}-${random}.${ext}`;
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("Boshqa");
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setChecking(false);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => data.subscription.unsubscribe();
  }, []);

  async function login(e) {
    e.preventDefault();
    setMessage("Tekshirilmoqda...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage("Kirish xatosi: " + error.message);
    } else {
      setMessage("Muvaffaqiyatli kirdingiz!");
      setPassword("");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setMessage("Hisobdan chiqdingiz.");
  }

  async function uploadSong(e) {
    e.preventDefault();

    if (!title.trim() || !artist.trim() || !audio) {
      setMessage("Qo‘shiq nomi, ijrochi va audio faylni kiriting.");
      return;
    }

    setLoading(true);
    setMessage("Yuklanmoqda...");

    try {
      const audioName = safeFileName(audio);

      const audioUpload = await supabase.storage
        .from("music")
        .upload(audioName, audio, {
          contentType: audio.type || "audio/mpeg",
          upsert: false
        });

      if (audioUpload.error) throw audioUpload.error;

      const audioUrl = supabase.storage
        .from("music")
        .getPublicUrl(audioName).data.publicUrl;

      let coverUrl = null;

      if (cover) {
        const coverName = safeFileName(cover);

        const coverUpload = await supabase.storage
          .from("music")
          .upload(coverName, cover, {
            contentType: cover.type || "image/jpeg",
            upsert: false
          });

        if (coverUpload.error) throw coverUpload.error;

        coverUrl = supabase.storage
          .from("music")
          .getPublicUrl(coverName).data.publicUrl;
      }

      const { error } = await supabase
        .from("songs")
        .insert({
          title: title.trim(),
          artist: artist.trim(),
          genre,
          audio_url: audioUrl,
          cover_url: coverUrl,
          is_published: true
        });

      if (error) throw error;

      setMessage("Qo‘shiq muvaffaqiyatli qo‘shildi! 🎵");
      setTitle("");
      setArtist("");
      setGenre("Boshqa");
      setAudio(null);
      setCover(null);
      e.target.reset();

    } catch (error) {
      setMessage("Xatolik: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <div className="admin">Tekshirilmoqda...</div>;
  }

  if (!user) {
    return (
      <div className="admin">
        <h2>🎵 Espofiy Admin</h2>
        <p>Admin hisobiga kiring</p>

        <form onSubmit={login}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Kirish</button>
        </form>

        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="admin">
      <h2>🎵 Espofiy Admin panel</h2>
      <p>{user.email}</p>

      <button type="button" onClick={logout}>
        Hisobdan chiqish
      </button>

      <hr />

      <form onSubmit={uploadSong}>
        <input
          placeholder="Qo‘shiq nomi"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          placeholder="Ijrochi"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          required
        />

        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option>Boshqa</option>
          <option>Pop</option>
          <option>Rap</option>
          <option>Rock</option>
          <option>Uzbek</option>
          <option>Electronic</option>
        </select>

        <p>Qo‘shiq fayli:</p>
        <input
          type="file"
          accept="audio/*,.mp3,.m4a,.wav"
          onChange={(e) => setAudio(e.target.files?.[0] || null)}
        />

        <p>Muqova rasmi (ixtiyoriy):</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files?.[0] || null)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Yuklanmoqda..." : "Qo‘shiqni yuklash"}
        </button>
      </form>

      <p>{message}</p>
    </div>
  );
}
