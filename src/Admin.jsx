
import React, { useEffect, useState } from "react";
import {
  supabase
} from "./supabase";
import {
  Music2, ListMusic, Users, Upload,
  Trash2, LogOut, RefreshCw, CheckCircle,
  AlertCircle, Headphones
} from "lucide-react";

function safeFileName(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at top,#32164c,#090710 65%)",
    color: "white",
    padding: "24px 16px 50px",
    fontFamily: "Inter,sans-serif"
  },
  wrap: { maxWidth: 650, margin: "auto" },
  card: {
    background: "rgba(30,22,43,.85)",
    border: "1px solid #ffffff12",
    borderRadius: 18,
    padding: 16,
    marginBottom: 15
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 13,
    marginBottom: 12,
    borderRadius: 11,
    border: "1px solid #49385c",
    background: "#171020",
    color: "white",
    fontSize: 14
  },
  button: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: 0,
    background: "#9149db",
    color: "white",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer"
  },
  muted: { color: "#a99bb9", fontSize: 12 }
};

export default function Admin({ onClose }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [songs, setSongs] = useState([]);
  const [songCount, setSongCount] = useState(0);
  const [playlistCount, setPlaylistCount] = useState(0);
  const [playlistUsers, setPlaylistUsers] = useState(0);

  const [files, setFiles] = useState([]);
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("Boshqa");
  const [cover, setCover] = useState(null);

  const [title, setTitle] = useState("");
  const [singleArtist, setSingleArtist] = useState("");
  const [audio, setAudio] = useState(null);
  const [singleCover, setSingleCover] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setChecking(false);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user || null)
    );

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  async function login(e) {
    e.preventDefault();
    setMessage("Tekshirilmoqda...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) setMessage("Kirish xatosi: " + error.message);
    else {
      setMessage("Xush kelibsiz!");
      setPassword("");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setMessage("Hisobdan chiqdingiz.");
  }

  async function loadDashboard() {
    const [songResult, playlistResult, listResult] = await Promise.all([
      supabase.from("songs")
        .select("id", { count: "exact", head: true }),
      supabase.from("playlists")
        .select("id,user_id", { count: "exact" }),
      supabase.from("songs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)
    ]);

    if (songResult.error) {
      setMessage("Statistika xatosi: " + songResult.error.message);
    }

    if (playlistResult.error) {
      setMessage("Playlist statistikasi: " + playlistResult.error.message);
    }

    setSongCount(songResult.count || 0);
    setPlaylistCount(playlistResult.count || 0);

    const uniqueUsers = new Set(
      (playlistResult.data || [])
        .map(p => p.user_id)
        .filter(Boolean)
    );

    setPlaylistUsers(uniqueUsers.size);
    setSongs(listResult.data || []);
  }

  async function uploadAudioFile(file, songTitle, songArtist, songGenre, coverFile) {
    const audioName = safeFileName(file);

    const audioUpload = await supabase.storage
      .from("music")
      .upload(audioName, file, {
        contentType: file.type || "audio/mpeg",
        upsert: false
      });

    if (audioUpload.error) throw audioUpload.error;

    const audioUrl = supabase.storage
      .from("music")
      .getPublicUrl(audioName).data.publicUrl;

    let coverUrl = null;

    if (coverFile) {
      const coverName = safeFileName(coverFile);

      const coverUpload = await supabase.storage
        .from("music")
        .upload(coverName, coverFile, {
          contentType: coverFile.type || "image/jpeg",
          upsert: false
        });

      if (coverUpload.error) throw coverUpload.error;

      coverUrl = supabase.storage
        .from("music")
        .getPublicUrl(coverName).data.publicUrl;
    }

    const { error } = await supabase.from("songs").insert({
      title: songTitle,
      artist: songArtist,
      genre: songGenre,
      audio_url: audioUrl,
      cover_url: coverUrl,
      is_published: true
    });

    if (error) throw error;
  }

  async function uploadMany(e) {
    e.preventDefault();

    if (!files.length || !artist.trim()) {
      setMessage("MP3 fayllar va ijrochi nomini kiriting.");
      return;
    }

    setLoading(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const name = file.name.replace(/\.[^/.]+$/, "");

        await uploadAudioFile(
          file,
          name,
          artist.trim(),
          genre,
          cover
        );

        success++;
      } catch (error) {
        failed++;
        console.error(file.name, error);
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
      setMessage(`Yuklanmoqda: ${i + 1}/${files.length}`);
    }

    setMessage(
      `Tugadi! ${success} ta yuklandi, ${failed} ta xatolik.`
    );

    setFiles([]);
    setCover(null);
    setArtist("");
    setLoading(false);
    await loadDashboard();
  }

  async function uploadSingle(e) {
    e.preventDefault();

    if (!title.trim() || !singleArtist.trim() || !audio) {
      setMessage("Barcha kerakli maydonlarni to‘ldiring.");
      return;
    }

    setLoading(true);
    setMessage("Yuklanmoqda...");

    try {
      await uploadAudioFile(
        audio,
        title.trim(),
        singleArtist.trim(),
        genre,
        singleCover
      );

      setMessage("Qo‘shiq muvaffaqiyatli qo‘shildi! 🎵");
      setTitle("");
      setSingleArtist("");
      setAudio(null);
      setSingleCover(null);
      e.target.reset();
      await loadDashboard();
    } catch (error) {
      setMessage("Xatolik: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSong(song) {
    if (!window.confirm(`"${song.title}" qo‘shig‘ini o‘chirasizmi?`)) {
      return;
    }

    const { error } = await supabase
      .from("songs")
      .delete()
      .eq("id", song.id);

    if (error) {
      setMessage("O‘chirish xatosi: " + error.message);
      return;
    }

    setMessage("Qo‘shiq o‘chirildi.");
    await loadDashboard();
  }

  if (checking) {
    return <div style={styles.page}>Tekshirilmoqda...</div>;
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.wrap, paddingTop: 70 }}>
          <div style={styles.card}>
            <h2>🎵 Espofiy Admin</h2>
            <p style={{ ...styles.muted, margin: "10px 0 20px" }}>
              Admin hisobiga kiring
            </p>
            <form onSubmit={login}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input
                style={styles.input}
                type="password"
                placeholder="Parol"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button style={styles.button}>Kirish</button>
            </form>
            <p style={{ marginTop: 15, fontSize: 13 }}>{message}</p>
            {onClose && (
              <button onClick={onClose} style={{ ...styles.button, marginTop: 12, background: "#30253e" }}>
                Orqaga
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22
        }}>
          <div>
            <h2 style={{ fontSize: 23 }}>🎵 Espofiy Admin</h2>
            <p style={styles.muted}>{user.email}</p>
          </div>
          <button
            onClick={logout}
            style={{
              background: "#30253e",
              color: "white",
              padding: 11,
              borderRadius: 12
            }}
          >
            <LogOut size={19} />
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: 9,
          marginBottom: 20
        }}>
          {[
            { label: "Qo‘shiqlar", value: songCount, icon: <Music2 /> },
            { label: "Playlistlar", value: playlistCount, icon: <ListMusic /> },
            { label: "Playlist egalari", value: playlistUsers, icon: <Users /> }
          ].map((item, i) => (
            <div key={i} style={{
              ...styles.card,
              padding: "13px 8px",
              margin: 0,
              textAlign: "center",
              minWidth: 0
            }}>
              <div style={{ color: "#bd80ff" }}>{item.icon}</div>
              <h2 style={{ fontSize: 22, margin: "7px 0" }}>
                {item.value}
              </h2>
              <p style={{ ...styles.muted, fontSize: 10 }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex",
          gap: 7,
          overflowX: "auto",
          marginBottom: 17
        }}>
          {[
            ["dashboard", "Statistika"],
            ["multiple", "Ko‘p yuklash"],
            ["single", "Bitta qo‘shiq"],
            ["songs", "Qo‘shiqlar"]
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                whiteSpace: "nowrap",
                padding: "10px 13px",
                borderRadius: 12,
                background: tab === id ? "#9149db" : "#241a30",
                color: "white",
                fontSize: 12
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {message && (
          <div style={{
            ...styles.card,
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontSize: 13
          }}>
            {loading ? <RefreshCw size={18} /> :
              <CheckCircle size={18} color="#b77aff" />}
            <span>{message}</span>
          </div>
        )}

        {loading && (
          <div style={styles.card}>
            <div style={{
              height: 7,
              background: "#382b46",
              borderRadius: 10,
              overflow: "hidden"
            }}>
              <div style={{
                width: `${progress}%`,
                height: "100%",
                background: "#a855f7",
                transition: "width .2s"
              }} />
            </div>
            <p style={{ ...styles.muted, marginTop: 8 }}>
              {progress}% bajarildi
            </p>
          </div>
        )}

        {tab === "dashboard" && (
          <>
            <div style={styles.card}>
              <h3>📊 Umumiy statistika</h3>
              <p style={{ ...styles.muted, marginTop: 10 }}>
                Bazadagi jami qo‘shiqlar: {songCount}
              </p>
              <p style={{ ...styles.muted, marginTop: 7 }}>
                Jami playlistlar: {playlistCount}
              </p>
              <p style={{ ...styles.muted, marginTop: 7 }}>
                Playlist yaratgan alohida foydalanuvchilar: {playlistUsers}
              </p>
              <button
                onClick={loadDashboard}
                style={{ ...styles.button, marginTop: 17 }}
              >
                <RefreshCw size={16} /> Yangilash
              </button>
            </div>

            <div style={styles.card}>
              <h3>⚡ Tezkor amallar</h3>
              <button
                onClick={() => setTab("multiple")}
                style={{ ...styles.button, marginTop: 14 }}
              >
                <Upload size={17} /> Ko‘p qo‘shiq yuklash
              </button>
              <button
                onClick={() => setTab("songs")}
                style={{ ...styles.button, marginTop: 10, background: "#30253e" }}
              >
                <Music2 size={17} /> Qo‘shiqlarni boshqarish
              </button>
            </div>
          </>
        )}

        {tab === "multiple" && (
          <div style={styles.card}>
            <h3>📂 Bir nechta qo‘shiq yuklash</h3>
            <p style={{ ...styles.muted, margin: "8px 0 16px" }}>
              Bir vaqtda bir nechta MP3, M4A yoki WAV fayl tanlang.
              Nomlar fayl nomidan olinadi.
            </p>

            <form onSubmit={uploadMany}>
              <label style={styles.muted}>Audio fayllar</label>
              <input
                style={{ ...styles.input, marginTop: 8 }}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav"
                multiple
                onChange={e => setFiles(Array.from(e.target.files || []))}
              />

              <p style={{ ...styles.muted, marginBottom: 14 }}>
                Tanlandi: {files.length} ta fayl
              </p>

              <input
                style={styles.input}
                placeholder="Ijrochi nomi (barchasi uchun)"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                required
              />

              <select
                style={styles.input}
                value={genre}
                onChange={e => setGenre(e.target.value)}
              >
                <option>Boshqa</option>
                <option>Pop</option>
                <option>Rap</option>
                <option>Rock</option>
                <option>Uzbek</option>
                <option>Electronic</option>
              </select>

              <label style={styles.muted}>Umumiy muqova rasmi (ixtiyoriy)</label>
              <input
                style={{ ...styles.input, marginTop: 8 }}
                type="file"
                accept="image/*"
                onChange={e => setCover(e.target.files?.[0] || null)}
              />

              <button
                style={styles.button}
                disabled={loading}
                type="submit"
              >
                <Upload size={17} />
                {loading ? "Yuklanmoqda..." : "Hammasini yuklash"}
              </button>
            </form>
          </div>
        )}

        {tab === "single" && (
          <div style={styles.card}>
            <h3>🎵 Bitta qo‘shiq yuklash</h3>
            <form onSubmit={uploadSingle} style={{ marginTop: 16 }}>
              <input
                style={styles.input}
                placeholder="Qo‘shiq nomi"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder="Ijrochi"
                value={singleArtist}
                onChange={e => setSingleArtist(e.target.value)}
                required
              />
              <select
                style={styles.input}
                value={genre}
                onChange={e => setGenre(e.target.value)}
              >
                <option>Boshqa</option>
                <option>Pop</option>
                <option>Rap</option>
                <option>Rock</option>
                <option>Uzbek</option>
                <option>Electronic</option>
              </select>
              <label style={styles.muted}>Audio fayl</label>
              <input
                style={{ ...styles.input, marginTop: 8 }}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav"
                onChange={e => setAudio(e.target.files?.[0] || null)}
              />
              <label style={styles.muted}>Muqova (ixtiyoriy)</label>
              <input
                style={{ ...styles.input, marginTop: 8 }}
                type="file"
                accept="image/*"
                onChange={e => setSingleCover(e.target.files?.[0] || null)}
              />
              <button style={styles.button} disabled={loading}>
                {loading ? "Yuklanmoqda..." : "Qo‘shiqni yuklash"}
              </button>
            </form>
          </div>
        )}

        {tab === "songs" && (
          <div style={styles.card}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15
            }}>
              <h3>🎧 Qo‘shiqlar ({songCount})</h3>
              <button
                onClick={loadDashboard}
                style={{ background: "transparent", color: "white" }}
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {songs.map(song => (
              <div key={song.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 0",
                borderBottom: "1px solid #ffffff12"
              }}>
                <Music2 color="#bd80ff" size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{
                    display: "block",
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {song.title}
                  </b>
                  <span style={styles.muted}>{song.artist}</span>
                </div>
                <button
                  onClick={() => deleteSong(song)}
                  style={{
                    background: "#49202d",
                    color: "#ff8b9d",
                    padding: 9,
                    borderRadius: 10
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}

            {songs.length === 0 && (
              <p style={styles.muted}>Hozircha qo‘shiqlar yo‘q.</p>
            )}
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            style={{
              ...styles.button,
              background: "#30253e",
              marginTop: 5
            }}
          >
            Ilovaga qaytish
          </button>
        )}
      </div>
    </div>
  );
}
