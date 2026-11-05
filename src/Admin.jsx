import React, { useState } from "react";
import { supabase } from "./supabase";
import { Upload, Music, Image, LogOut } from "lucide-react";

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
      setMessage("Qo‘shiq nomi, ijrochi va audio fayl kerak!");
      return;
    }

    setLoading(true);
    setMessage("");

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

      const { error } = await supabase.from("songs").insert({
        title,
        artist,
        genre,
        audio_url: audioUrl,
        cover_url: coverUrl,
        is_published: true
      });

      if (error) throw error;

      setMessage("Musiqa muvaffaqiyatli yuklandi! 🎉");
      setTitle("");
      setArtist("");
      setAudio(null);
      setCover(null);
    } catch (error) {
      setMessage("Xatolik: " + error.message);
    }

    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#090710",
      color: "white",
      padding: "25px 18px",
      fontFamily: "Arial"
    }}>
      <h1 style={{ color: "#bd78ff" }}>Espofiy Admin</h1>
      <p style={{ color: "#aaa", marginTop: 8 }}>
        Musiqalarni shu yerdan yuklaysan
      </p>

      <form onSubmit={uploadSong} style={{
        marginTop: 30,
        display: "grid",
        gap: 16
      }}>
        <input
          placeholder="Qo‘shiq nomi"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={fieldStyle}
        />

        <input
          placeholder="Ijrochi"
          value={artist}
          onChange={e => setArtist(e.target.value)}
          style={fieldStyle}
        />

        <select
          value={genre}
          onChange={e => setGenre(e.target.value)}
          style={fieldStyle}
        >
          <option>Pop</option>
          <option>Rap</option>
          <option>Hip-Hop</option>
          <option>Rock</option>
          <option>Electronic</option>
          <option>Uzbek</option>
          <option>Boshqa</option>
        </select>

        <label style={uploadStyle}>
          <Music size={22} />
          Audio fayl tanlash
          <input
            type="file"
            accept="audio/*"
            onChange={e => setAudio(e.target.files[0])}
            hidden
          />
        </label>

        {audio && <p>{audio.name}</p>}

        <label style={uploadStyle}>
          <Image size={22} />
          Muqova rasmi tanlash
          <input
            type="file"
            accept="image/*"
            onChange={e => setCover(e.target.files[0])}
            hidden
          />
        </label>

        {cover && <p>{cover.name}</p>}

        <button type="submit" disabled={loading} style={{
          padding: 16,
          borderRadius: 12,
          background: "#933ee0",
          color: "white",
          fontWeight: "bold",
          border: 0
        }}>
          {loading ? "Yuklanmoqda..." : "Musiqani yuklash"}
        </button>

        {message && <p>{message}</p>}
      </form>
    </div>
  );
}

const fieldStyle = {
  padding: 15,
  borderRadius: 10,
  border: "1px solid #453052",
  background: "#171320",
  color: "white",
  fontSize: 15
};

const uploadStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 18,
  border: "1px dashed #933ee0",
  borderRadius: 12,
  color: "#c27aff"
};
