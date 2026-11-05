import React, { useState } from "react";
import { supabase } from "./supabase";

export default function Admin() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("Pop");
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadSong(e) {
    e.preventDefault();

    if (!title || !artist || !audio) {
      setMessage("Qo‘shiq nomi, ijrochi va audio faylni tanlang!");
      return;
    }

    setLoading(true);
    setMessage("Yuklanmoqda...");

    try {
      const audioName = `${Date.now()}-${audio.name}`;

      const audioUpload = await supabase.storage
        .from("music")
        .upload(audioName, audio);

      if (audioUpload.error) throw audioUpload.error;

      const audioUrl = supabase.storage
        .from("music")
        .getPublicUrl(audioName).data.publicUrl;

      let coverUrl = null;

      if (cover) {
        const coverName = `${Date.now()}-${cover.name}`;

        const coverUpload = await supabase.storage
          .from("music")
          .upload(coverName, cover);

        if (coverUpload.error) throw coverUpload.error;

        coverUrl = supabase.storage
          .from("music")
          .getPublicUrl(coverName).data.publicUrl;
      }

      const { error } = await supabase
        .from("songs")
        .insert({
          title,
          artist,
          genre,
          audio_url: audioUrl,
          cover_url: coverUrl,
          is_published: true
        });

      if (error) throw error;

      setMessage("Musiqa muvaffaqiyatli qo‘shildi!");

      setTitle("");
      setArtist("");
      setGenre("Pop");
      setAudio(null);
      setCover(null);

    } catch (error) {
      setMessage("Xatolik: " + error.message);
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>🎵 Espofiy Admin</h1>
      <p style={styles.subtitle}>Musiqalarni boshqarish paneli</p>

      <form onSubmit={uploadSong} style={styles.form}>

        <input
          style={styles.input}
          placeholder="Qo‘shiq nomi"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Ijrochi"
          value={artist}
          onChange={e => setArtist(e.target.value)}
        />

        <select
          style={styles.input}
          value={genre}
          onChange={e => setGenre(e.target.value)}
        >
          <option value="Pop">Pop</option>
          <option value="Rap">Rap</option>
          <option value="Hip-Hop">Hip-Hop</option>
          <option value="Rock">Rock</option>
          <option value="Electronic">Electronic</option>
          <option value="Uzbek">Uzbek</option>
          <option value="Boshqa">Boshqa</option>
        </select>

        <label style={styles.label}>
          🎧 Audio fayl tanlash
          <input
            type="file"
            accept=".mp3,.m4a,.wav,.aac,.ogg"
            onChange={e => setAudio(e.target.files?.[0] || null)}
            style={styles.file}
          />
        </label>

        {audio && (
          <p style={styles.selected}>
            Tanlandi: {audio.name}
          </p>
        )}

        <label style={styles.label}>
          🖼 Muqova rasmi tanlash
          <input
            type="file"
            accept="image/*"
            onChange={e => setCover(e.target.files?.[0] || null)}
            style={styles.file}
          />
        </label>

        {cover && (
          <p style={styles.selected}>
            Tanlandi: {cover.name}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Yuklanmoqda..." : "MUSIQANI YUKLASH"}
        </button>

        {message && (
          <p style={styles.message}>{message}</p>
        )}

      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#090710",
    color: "white",
    padding: "30px 18px",
    fontFamily: "Arial"
  },
  heading: {
    color: "#bd78ff",
    fontSize: 27
  },
  subtitle: {
    color: "#aaa",
    marginTop: 8
  },
  form: {
    display: "grid",
    gap: 18,
    marginTop: 30
  },
  input: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #453052",
    background: "#171320",
    color: "white",
    fontSize: 15
  },
  label: {
    display: "grid",
    gap: 12,
    padding: 16,
    border: "1px dashed #933ee0",
    borderRadius: 12,
    color: "#c27aff"
  },
  file: {
    display: "block",
    width: "100%",
    color: "white",
    fontSize: 14
  },
  selected: {
    color: "#bd78ff",
    fontSize: 13
  },
  button: {
    padding: 17,
    borderRadius: 12,
    background: "#933ee0",
    color: "white",
    fontWeight: "bold",
    border: 0,
    fontSize: 15
  },
  message: {
    color: "#bd78ff",
    overflowWrap: "anywhere"
  }
};
