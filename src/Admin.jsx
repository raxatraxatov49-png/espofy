
import React, { useEffect, useState } from "react";
import {
  ArrowLeft, Music, Trash2, Upload, LogOut,
  RefreshCw, Headphones, AlertCircle
} from "lucide-react";
import { supabase } from "./supabase";

function getStoragePath(url) {
  if (!url) return null;

  const marker = "/storage/v1/object/public/music/";
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    url.substring(index + marker.length).split("?")[0]
  );
}

export default function Admin({ onClose }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [audioFiles, setAudioFiles] = useState([]);
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("Boshqa");
  const [coverFile, setCoverFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [songCount, setSongCount] = useState(0);
  const [playlistCount, setPlaylistCount] = useState(0);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      const { data: admin } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (admin) {
        setSession(data.session);
        loadData();
      }
    }
  }

  async function login(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (loginError) {
      setError("Email yoki parol noto‘g‘ri.");
      setLoading(false);
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      setError("Sizda admin huquqi yo‘q.");
      setLoading(false);
      return;
    }

    setSession(data.session);
    setLoading(false);
    loadData();
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function loadData() {
    setLoading(true);
    setError("");

    const { data, error: songsError } = await supabase
      .from("songs")
      .select("*")
      .order("created_at", { ascending: false });

    if (songsError) {
      setError("Musiqalarni yuklashda xatolik: " + songsError.message);
    } else {
      setSongs(data || []);
    }

    const { count: songTotal } = await supabase
      .from("songs")
      .select("id", { count: "exact", head: true });

    const { count: playlistTotal } = await supabase
      .from("playlists")
      .select("id", { count: "exact", head: true });

    setSongCount(songTotal || 0);
    setPlaylistCount(playlistTotal || 0);
    setLoading(false);
  }

  async function deleteSong(song) {
    const confirmed = window.confirm(
      `"${song.title}" musiqasini o‘chirmoqchimisiz?`
    );

    if (!confirmed) return;

    setBusyId(song.id);
    setMessage("");
    setError("");

    try {
      const paths = [
        getStoragePath(song.audio_url),
        getStoragePath(song.cover_url)
      ].filter(Boolean);

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("music")
          .remove(paths);

        if (storageError) {
          throw new Error(
            "Fayllarni Storage'dan o‘chirib bo‘lmadi: " +
            storageError.message
          );
        }
      }

      const { error: deleteError } = await supabase
        .from("songs")
        .delete()
        .eq("id", song.id);

      if (deleteError) {
        throw new Error(
          "Bazadan o‘chirib bo‘lmadi: " + deleteError.message
        );
      }

      setSongs(prev => prev.filter(item => item.id !== song.id));
      setSongCount(prev => Math.max(0, prev - 1));
      setMessage("Musiqa muvaffaqiyatli o‘chirildi!");
    } catch (err) {
      setError(err.message || "O‘chirishda xatolik yuz berdi.");
    }

    setBusyId(null);
  }

  async function uploadMany(e) {
    e.preventDefault();

    if (!audioFiles.length || !artist.trim()) {
      setError("Musiqalarni va ijrochi nomini kiriting.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");
    setMessage("");

    let success = 0;

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      const audioPath =
        "audio/" + Date.now() + "_" + i + "_" + safeName + ".mp3";

      try {
        const { error: audioError } = await supabase.storage
          .from("music")
          .upload(audioPath, file, {
            contentType: file.type || "audio/mpeg",
            upsert: false
          });

        if (audioError) throw audioError;

        const { data: audioData } = supabase.storage
          .from("music")
          .getPublicUrl(audioPath);

        let coverUrl = null;

        if (coverFile) {
          const coverPath =
            "covers/" + Date.now() + "_" + i + "_" +
            coverFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");

          const { error: coverError } = await supabase.storage
            .from("music")
            .upload(coverPath, coverFile, { upsert: false });

          if (coverError) throw coverError;

          const { data: coverData } = supabase.storage
            .from("music")
            .getPublicUrl(coverPath);

          coverUrl = coverData.publicUrl;
        }

        const { error: insertError } = await supabase
          .from("songs")
          .insert({
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: artist.trim(),
            genre,
            audio_url: audioData.publicUrl,
            cover_url: coverUrl,
            is_published: true
          });

        if (insertError) throw insertError;

        success++;
      } catch (err) {
        console.error(file.name, err);
      }

      setProgress(Math.round(((i + 1) / audioFiles.length) * 100));
    }

    setUploading(false);
    setAudioFiles([]);
    setCoverFile(null);

    if (success > 0) {
      setMessage(`${success} ta musiqa yuklandi!`);
      loadData();
    }

    if (success < audioFiles.length) {
      setError("Ayrim musiqalar yuklanmadi. Supabase sozlamalarini tekshiring.");
    }
  }

  const card = {
    background: "#191724",
    border: "1px solid #302a40",
    borderRadius: 15,
    padding: 16,
    marginBottom: 14
  };

  const input = {
    width: "100%",
    boxSizing: "border-box",
    padding: 13,
    borderRadius: 10,
    border: "1px solid #393247",
    background: "#100e18",
    color: "white",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12
  };

  const button = {
    width: "100%",
    padding: 13,
    border: 0,
    borderRadius: 10,
    background: "#8b5cf6",
    color: "white",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer"
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      overflowY: "auto",
      background: "#100e18",
      color: "white",
      padding: 16,
      fontFamily: "Inter, sans-serif"
    }}>
      <div style={{
        maxWidth: 600,
        margin: "0 auto",
        paddingBottom: 40
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22
        }}>
          <button onClick={onClose} style={{
            background: "#24202f",
            border: 0,
            color: "white",
            borderRadius: 10,
            padding: 10
          }}>
            <ArrowLeft size={20} />
          </button>

          <h2 style={{ margin: 0 }}>Espofiy Admin</h2>

          {session && (
            <button onClick={logout} style={{
              background: "#24202f",
              border: 0,
              color: "white",
              borderRadius: 10,
              padding: 10
            }}>
              <LogOut size={19} />
            </button>
          )}
        </div>

        {!session ? (
          <form onSubmit={login} style={card}>
            <h3>Admin kirish</h3>
            <input
              style={input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              style={input}
              type="password"
              placeholder="Parol"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
            <button style={button} disabled={loading}>
              {loading ? "Kutilmoqda..." : "Kirish"}
            </button>
          </form>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12
            }}>
              <div style={card}>
                <Music color="#a78bfa" />
                <h2>{songCount}</h2>
                <span style={{ color: "#aaa" }}>Musiqalar</span>
              </div>
              <div style={card}>
                <Headphones color="#a78bfa" />
                <h2>{playlistCount}</h2>
                <span style={{ color: "#aaa" }}>Pleylistlar</span>
              </div>
            </div>

            <form onSubmit={uploadMany} style={card}>
              <h3><Upload size={18} /> Bir nechta musiqa yuklash</h3>

              <label>Musiqalarni tanlang</label>
              <input
                style={input}
                type="file"
                accept="audio/*"
                multiple
                onChange={e => setAudioFiles(Array.from(e.target.files || []))}
              />

              <label>Ijrochi</label>
              <input
                style={input}
                placeholder="Masalan: PRINCE"
                value={artist}
                onChange={e => setArtist(e.target.value)}
              />

              <label>Janr</label>
              <select
                style={input}
                value={genre}
                onChange={e => setGenre(e.target.value)}
              >
                <option>Boshqa</option>
                <option>Pop</option>
                <option>Rap</option>
                <option>Rock</option>
                <option>Uzbek</option>
                <option>Ruskiy</option>
              </select>

              <label>Umumiy muqova (ixtiyoriy)</label>
              <input
                style={input}
                type="file"
                accept="image/*"
                onChange={e => setCoverFile(e.target.files?.[0] || null)}
              />

              {audioFiles.length > 0 && (
                <p style={{ color: "#aaa", fontSize: 13 }}>
                  {audioFiles.length} ta musiqa tanlandi
                </p>
              )}

              {uploading && (
                <p style={{ color: "#a78bfa" }}>
                  Yuklanmoqda: {progress}%
                </p>
              )}

              <button style={button} disabled={uploading}>
                {uploading ? "Yuklanmoqda..." : "Musiqalarni yuklash"}
              </button>
            </form>

            <div style={card}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <h3> Barcha musiqalar ({songs.length})</h3>
                <button onClick={loadData} style={{
                  background: "#302a40",
                  border: 0,
                  color: "white",
                  padding: 9,
                  borderRadius: 9
                }}>
                  <RefreshCw size={17} />
                </button>
              </div>

              {loading && <p>Yuklanmoqda...</p>}

              {songs.map(song => (
                <div key={song.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: "1px solid #302a40"
                }}>
                  {song.cover_url ? (
                    <img
                      src={song.cover_url}
                      alt=""
                      style={{
                        width: 45,
                        height: 45,
                        borderRadius: 8,
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 45,
                      height: 45,
                      borderRadius: 8,
                      background: "#302a40",
                      display: "grid",
                      placeItems: "center"
                    }}>
                      <Music />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {song.title}
                    </b>
                    <small style={{ color: "#aaa" }}>
                      {song.artist}
                    </small>
                  </div>

                  <button
                    disabled={busyId === song.id}
                    onClick={() => deleteSong(song)}
                    style={{
                      border: 0,
                      background: "#4a202b",
                      color: "#ff6b7a",
                      borderRadius: 9,
                      padding: 10
                    }}
                  >
                    {busyId === song.id
                      ? "..."
                      : <Trash2 size={18} />}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {message && (
          <p style={{
            background: "#173d2c",
            color: "#75e6a5",
            padding: 12,
            borderRadius: 10
          }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{
            background: "#451f2a",
            color: "#ff9292",
            padding: 12,
            borderRadius: 10
          }}>
            <AlertCircle size={16} /> {error}
          </p>
        )}
      </div>
    </div>
  );
}
