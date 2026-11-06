
import React, { useEffect, useState } from "react";
import {
  ArrowLeft, Music, Trash2, Upload, LogOut,
  RefreshCw, Headphones, ListMusic, ChevronRight,
  TrendingUp, Play, Check, X, Pencil, Save, Activity,
  Megaphone, Eye, EyeOff
} from "lucide-react";
import { supabase } from "./supabase";

const fileInputStyle = {
  display: "block",
  width: "100%",
  minHeight: 48,
  boxSizing: "border-box",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #8b5cf6",
  background: "#191724",
  color: "white",
  fontSize: 14,
  marginTop: 8,
  marginBottom: 12,
  opacity: 1,
  cursor: "pointer"
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #383344",
  background: "#191724",
  color: "white",
  marginTop: 8,
  marginBottom: 12,
  outline: "none"
};

const buttonStyle = {
  border: "none",
  borderRadius: 10,
  padding: "11px 14px",
  cursor: "pointer",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7
};

function getStoragePath(url) {
  if (!url) return null;

  const marker = "/storage/v1/object/public/music/";
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.substring(index + marker.length));
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function safeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getTitleFromFile(name) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistSongs, setPlaylistSongs] = useState([]);

  const [announcements, setAnnouncements] = useState([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  const [tab, setTab] = useState("dashboard");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedPlaylistSongs, setSelectedPlaylistSongs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("Pop");
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkArtist, setBulkArtist] = useState("");
  const [bulkGenre, setBulkGenre] = useState("Pop");
  const [bulkCover, setBulkCover] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkUploading, setBulkUploading] = useState(false);

  const [editingSong, setEditingSong] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");

  useEffect(() => {
    checkSession();

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession) {
        verifyAdmin(newSession);
      } else {
        setIsAdmin(false);
        setChecking(false);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function checkSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        await verifyAdmin(data.session);
      } else {
        setChecking(false);
      }
    } catch (error) {
      console.error(error);
      setChecking(false);
    }
  }

  async function verifyAdmin(currentSession) {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", currentSession.user.id)
        .maybeSingle();

      if (error) throw error;

      setIsAdmin(!!data);

      if (data) {
        await loadData();
      }
    } catch (error) {
      console.error("Admin tekshirish xatosi:", error);
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  }

  async function login(e) {
    e.preventDefault();
    setLoginLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (adminError) throw adminError;

      if (!admin) {
        await supabase.auth.signOut();
        throw new Error("Siz admin emassiz!");
      }

      setSession(data.session);
      setIsAdmin(true);
      await loadData();
    } catch (error) {
      setMessage(error.message || "Kirishda xatolik");
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  }

  async function loadData() {
    setLoading(true);

    try {
      const [
        songsResult,
        playlistsResult,
        playlistSongsResult,
        announcementsResult
      ] = await Promise.all([
        supabase.from("songs").select("*").order("created_at", { ascending: false }),
        supabase.from("playlists").select("*").order("created_at", { ascending: false }),
        supabase.from("playlist_songs").select("playlist_id,song_id"),
        supabase.from("announcements").select("*").order("created_at", { ascending: false })
      ]);

      if (songsResult.error) throw songsResult.error;
      if (playlistsResult.error) throw playlistsResult.error;
      if (playlistSongsResult.error) throw playlistSongsResult.error;
      if (announcementsResult.error) throw announcementsResult.error;

      setSongs(songsResult.data || []);
      setPlaylists(playlistsResult.data || []);
      setPlaylistSongs(playlistSongsResult.data || []);
      setAnnouncements(announcementsResult.data || []);
    } catch (error) {
      console.error(error);
      setMessage("Ma'lumotlarni yuklashda xatolik: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadToStorage(file, folder) {
    const path = `${folder}/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}_${safeName(file.name)}`;

    const { error } = await supabase.storage
      .from("music")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });

    if (error) throw error;

    const { data } = supabase.storage.from("music").getPublicUrl(path);

    return data.publicUrl;
  }

  async function uploadSingle(e) {
    e.preventDefault();

    if (!audioFile) {
      setMessage("Avval musiqa faylini tanlang!");
      return;
    }

    if (!title.trim() || !artist.trim()) {
      setMessage("Musiqa nomi va ijrochini kiriting!");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const audioUrl = await uploadToStorage(audioFile, "audio");

      let coverUrl = null;

      if (coverFile) {
        coverUrl = await uploadToStorage(coverFile, "covers");
      }

      const { error } = await supabase.from("songs").insert({
        title: title.trim(),
        artist: artist.trim(),
        genre,
        audio_url: audioUrl,
        cover_url: coverUrl,
        is_published: true
      });

      if (error) throw error;

      setTitle("");
      setArtist("");
      setGenre("Pop");
      setAudioFile(null);
      setCoverFile(null);

      const audioInput = document.getElementById("single-audio");
      const coverInput = document.getElementById("single-cover");

      if (audioInput) audioInput.value = "";
      if (coverInput) coverInput.value = "";

      setMessage("Musiqa muvaffaqiyatli yuklandi!");
      await loadData();
    } catch (error) {
      console.error(error);
      setMessage("Yuklashda xatolik: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function uploadBulk() {
    if (!bulkFiles.length) {
      setMessage("Musiqa fayllarini tanlang!");
      return;
    }

    if (!bulkArtist.trim()) {
      setMessage("Ijrochi nomini kiriting!");
      return;
    }

    setBulkUploading(true);
    setBulkProgress(0);
    setMessage("");

    let success = 0;
    let failed = 0;

    for (let i = 0; i < bulkFiles.length; i++) {
      const file = bulkFiles[i];

      try {
        const audioUrl = await uploadToStorage(file, "audio");

        let coverUrl = null;

        if (bulkCover) {
          coverUrl = await uploadToStorage(bulkCover, "covers");
        }

        const { error } = await supabase.from("songs").insert({
          title: getTitleFromFile(file.name),
          artist: bulkArtist.trim(),
          genre: bulkGenre,
          audio_url: audioUrl,
          cover_url: coverUrl,
          is_published: true
        });

        if (error) throw error;

        success++;
      } catch (error) {
        console.error("Fayl yuklash xatosi:", file.name, error);
        failed++;
      }

      setBulkProgress(Math.round(((i + 1) / bulkFiles.length) * 100));
    }

    setBulkUploading(false);
    setBulkFiles([]);
    setBulkCover(null);

    const bulkInput = document.getElementById("bulk-audio");
    const bulkCoverInput = document.getElementById("bulk-cover");

    if (bulkInput) bulkInput.value = "";
    if (bulkCoverInput) bulkCoverInput.value = "";

    setMessage(`Yuklandi: ${success} ta. Xatolik: ${failed} ta.`);

    await loadData();
  }

  async function deleteSong(song) {
    if (!window.confirm(`"${song.title}" musiqasini o'chirmoqchimisiz?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", song.id);

      if (error) throw error;

      const paths = [
        getStoragePath(song.audio_url),
        getStoragePath(song.cover_url)
      ].filter(Boolean);

      if (paths.length) {
        const { error: storageError } = await supabase.storage
          .from("music")
          .remove(paths);

        if (storageError) {
          console.error("Storage o'chirish xatosi:", storageError);
        }
      }

      setMessage("Musiqa o'chirildi!");
      await loadData();
    } catch (error) {
      setMessage("O'chirishda xatolik: " + error.message);
    }
  }

  async function approveSong(song) {
    try {
      const { error } = await supabase
        .from("songs")
        .update({ is_published: true })
        .eq("id", song.id);

      if (error) throw error;

      setMessage("Musiqa tasdiqlandi!");
      await loadData();
    } catch (error) {
      setMessage("Xatolik: " + error.message);
    }
  }

  async function rejectSong(song) {
    await deleteSong(song);
  }

  function startEdit(song) {
    setEditingSong(song.id);
    setEditTitle(song.title || "");
    setEditArtist(song.artist || "");
  }

  async function saveEdit(songId) {
    if (!editTitle.trim() || !editArtist.trim()) {
      setMessage("Nom va ijrochi bo'sh bo'lmasin!");
      return;
    }

    try {
      const { error } = await supabase
        .from("songs")
        .update({
          title: editTitle.trim(),
          artist: editArtist.trim()
        })
        .eq("id", songId);

      if (error) throw error;

      setEditingSong(null);
      setMessage("O'zgarishlar saqlandi!");
      await loadData();
    } catch (error) {
      setMessage("Saqlashda xatolik: " + error.message);
    }
  }

  async function openPlaylist(playlist) {
    setSelectedPlaylist(playlist);

    const ids = playlistSongs
      .filter(item => item.playlist_id === playlist.id)
      .map(item => item.song_id);

    setSelectedPlaylistSongs(
      songs.filter(song => ids.includes(song.id))
    );
  }

  async function saveAnnouncement(e) {
    e.preventDefault();

    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      setMessage("E'lon sarlavhasi va matnini kiriting!");
      return;
    }

    setAnnouncementSaving(true);
    setMessage("");

    try {
      const values = {
        title: announcementTitle.trim(),
        message: announcementMessage.trim()
      };

      let result;

      if (editingAnnouncement) {
        result = await supabase
          .from("announcements")
          .update(values)
          .eq("id", editingAnnouncement);
      } else {
        result = await supabase
          .from("announcements")
          .insert(values);
      }

      if (result.error) throw result.error;

      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setEditingAnnouncement(null);

      setMessage("E'lon saqlandi!");
      await loadData();
    } catch (error) {
      setMessage("E'lon saqlashda xatolik: " + error.message);
    } finally {
      setAnnouncementSaving(false);
    }
  }

  function editAnnouncement(item) {
    setEditingAnnouncement(item.id);
    setAnnouncementTitle(item.title || "");
    setAnnouncementMessage(item.message || "");
  }

  async function deleteAnnouncement(id) {
    if (!window.confirm("Bu e'lonni o'chirmoqchimisiz?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessage("E'lon o'chirildi!");
      await loadData();
    } catch (error) {
      setMessage("O'chirishda xatolik: " + error.message);
    }
  }

  async function toggleAnnouncement(item) {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);

      if (error) throw error;

      setMessage("E'lon holati o'zgartirildi!");
      await loadData();
    } catch (error) {
      setMessage("Xatolik: " + error.message);
    }
  }

  const publishedSongs = songs.filter(song => song.is_published === true);

  const pendingSongs = songs.filter(
    song => song.is_published === false && song.submitted_by
  );

  const totalPlays = songs.reduce(
    (sum, song) => sum + (Number(song.play_count) || 0),
    0
  );

  const topSongs = [...publishedSongs]
    .sort((a, b) => (Number(b.play_count) || 0) - (Number(a.play_count) || 0))
    .slice(0, 10);

  const artistMap = {};

  publishedSongs.forEach(song => {
    const name = (song.artist || "Noma'lum").trim();
    const key = name.toLowerCase();

    if (!artistMap[key]) {
      artistMap[key] = {
        name,
        songs: 0,
        plays: 0
      };
    }

    artistMap[key].songs++;
    artistMap[key].plays += Number(song.play_count) || 0;
  });

  const artistStats = Object.values(artistMap)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  const cardStyle = {
    background: "#191724",
    border: "1px solid #302b3d",
    borderRadius: 14,
    padding: 16,
    minWidth: 0
  };

  const primaryButton = {
    ...buttonStyle,
    background: "#8b5cf6",
    color: "white"
  };

  const dangerButton = {
    ...buttonStyle,
    background: "#dc3545",
    color: "white"
  };

  const greenButton = {
    ...buttonStyle,
    background: "#16a34a",
    color: "white"
  };

  function renderSong(song, showSubmitter = false) {
    return (
      <div
        key={song.id}
        style={{
          ...cardStyle,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 12
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {song.cover_url ? (
            <img
              src={song.cover_url}
              alt=""
              style={{
                width: 58,
                height: 58,
                borderRadius: 10,
                objectFit: "cover"
              }}
            />
          ) : (
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 10,
                background: "#302b3d",
                display: "grid",
                placeItems: "center"
              }}
            >
              <Music size={25} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            {editingSong === song.id ? (
              <>
                <input
                  style={inputStyle}
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Musiqa nomi"
                />
                <input
                  style={inputStyle}
                  value={editArtist}
                  onChange={e => setEditArtist(e.target.value)}
                  placeholder="Ijrochi"
                />
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                  {song.title}
                </div>
                <div style={{ color: "#aaa", fontSize: 13 }}>
                  {song.artist}
                </div>
                <div style={{ color: "#888", fontSize: 12 }}>
                  {song.genre || "Janr yo'q"} · {Number(song.play_count) || 0} marta tinglangan
                </div>
              </>
            )}
          </div>
        </div>

        {song.audio_url && (
          <audio
            controls
            preload="none"
            src={song.audio_url}
            style={{ width: "100%", height: 38 }}
          />
        )}

        {showSubmitter && (
          <div style={{ fontSize: 12, color: "#aaa" }}>
            Yuboruvchi: {song.submitted_by || "-"}
            <br />
            Sana: {formatDate(song.created_at)}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {editingSong === song.id ? (
            <>
              <button
                type="button"
                style={greenButton}
                onClick={() => saveEdit(song.id)}
              >
                <Save size={16} /> Saqlash
              </button>

              <button
                type="button"
                style={buttonStyle}
                onClick={() => setEditingSong(null)}
              >
                Bekor qilish
              </button>
            </>
          ) : (
            <button
              type="button"
              style={{ ...buttonStyle, background: "#373044", color: "white" }}
              onClick={() => startEdit(song)}
            >
              <Pencil size={16} /> Tahrirlash
            </button>
          )}

          {showSubmitter && (
            <button
              type="button"
              style={greenButton}
              onClick={() => approveSong(song)}
            >
              <Check size={16} /> Tasdiqlash
            </button>
          )}

          {showSubmitter && (
            <button
              type="button"
              style={dangerButton}
              onClick={() => rejectSong(song)}
            >
              <X size={16} /> Rad etish
            </button>
          )}

          <button
            type="button"
            style={dangerButton}
            onClick={() => deleteSong(song)}
          >
            <Trash2 size={16} /> O'chirish
          </button>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: "center", padding: 40 }}>
          Yuklanmoqda...
        </div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, maxWidth: 420, margin: "60px auto" }}>
          <h2 style={{ textAlign: "center" }}>Admin panel</h2>

          <p style={{ color: "#aaa", textAlign: "center" }}>
            Admin hisobingizga kiring
          </p>

          <form onSubmit={login}>
            <label>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
            />

            <label>Parol</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Parol"
              required
            />

            {message && (
              <p style={{ color: "#f87171", fontSize: 13 }}>{message}</p>
            )}

            <button
              type="submit"
              style={{ ...primaryButton, width: "100%" }}
              disabled={loginLoading}
            >
              {loginLoading ? "Kirilmoqda..." : "Kirish"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 20
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>ESPOFIY ADMIN</h2>
            <div style={{ color: "#999", fontSize: 12 }}>
              Musiqa boshqaruv paneli
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={{ ...buttonStyle, background: "#302b3d", color: "white" }}
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw size={16} /> Yangilash
            </button>

            <button
              type="button"
              style={dangerButton}
              onClick={logout}
            >
              <LogOut size={16} /> Chiqish
            </button>
          </div>
        </header>

        {message && (
          <div
            style={{
              background: "#272238",
              border: "1px solid #59447e",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
              color: "#e9ddff",
              overflowWrap: "anywhere"
            }}
          >
            {message}

            <button
              type="button"
              onClick={() => setMessage("")}
              style={{
                float: "right",
                border: 0,
                background: "transparent",
                color: "white"
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 12,
            marginBottom: 18
          }}
        >
          {[
            ["dashboard", "Boshqaruv"],
            ["playlists", "Playlistlar"],
            ["music", "Musiqalar"],
            ["pending", "Tekshiruv"],
            ["announcements", "E'lonlar"]
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => {
                setTab(key);
                setSelectedPlaylist(null);
              }}
              style={{
                ...buttonStyle,
                flexShrink: 0,
                background: tab === key ? "#8b5cf6" : "#252131",
                color: "white"
              }}
            >
              {key === "announcements" && <Megaphone size={16} />}
              {label}
            </button>
          ))}
        </div>

        {tab === "announcements" && (
          <>
            <h3>
              <Megaphone size={20} style={{ verticalAlign: "middle" }} /> E'lonlarni boshqarish
            </h3>

            <form
              onSubmit={saveAnnouncement}
              style={{ ...cardStyle, marginBottom: 20 }}
            >
              <h4>
                {editingAnnouncement ? "E'lonni tahrirlash" : "Yangi e'lon qo'shish"}
              </h4>

              <label>E'lon sarlavhasi</label>
              <input
                style={inputStyle}
                value={announcementTitle}
                onChange={e => setAnnouncementTitle(e.target.value)}
                placeholder="Masalan: Yangi musiqalar!"
                maxLength={100}
                required
              />

              <label>E'lon matni</label>
              <textarea
                style={{
                  ...inputStyle,
                  minHeight: 110,
                  resize: "vertical",
                  fontFamily: "Arial, sans-serif"
                }}
                value={announcementMessage}
                onChange={e => setAnnouncementMessage(e.target.value)}
                placeholder="E'lon matnini yozing..."
                maxLength={1000}
                required
              />

              <button
                type="submit"
                style={{ ...primaryButton, width: "100%" }}
                disabled={announcementSaving}
              >
                <Save size={17} />
                {announcementSaving
                  ? "Saqlanmoqda..."
                  : editingAnnouncement
                    ? "O'zgarishlarni saqlash"
                    : "E'lonni qo'shish"}
              </button>

              {editingAnnouncement && (
                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: "#373044",
                    color: "white",
                    width: "100%",
                    marginTop: 8
                  }}
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setAnnouncementTitle("");
                    setAnnouncementMessage("");
                  }}
                >
                  Bekor qilish
                </button>
              )}
            </form>

            <h3>Barcha e'lonlar ({announcements.length})</h3>

            {announcements.map(item => (
              <div
                key={item.id}
                style={{
                  ...cardStyle,
                  marginBottom: 12
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center"
                  }}
                >
                  <strong style={{ overflowWrap: "anywhere" }}>
                    {item.title}
                  </strong>

                  <span
                    style={{
                      color: item.is_active ? "#4ade80" : "#f87171",
                      fontSize: 12,
                      flexShrink: 0
                    }}
                  >
                    {item.is_active ? "Faol" : "Yashirilgan"}
                  </span>
                </div>

                <p
                  style={{
                    color: "#bbb",
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere"
                  }}
                >
                  {item.message}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    style={item.is_active ? buttonStyle : greenButton}
                    onClick={() => toggleAnnouncement(item)}
                  >
                    {item.is_active ? (
                      <>
                        <EyeOff size={16} /> Yashirish
                      </>
                    ) : (
                      <>
                        <Eye size={16} /> Ko'rsatish
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    style={{
                      ...buttonStyle,
                      background: "#373044",
                      color: "white"
                    }}
                    onClick={() => editAnnouncement(item)}
                  >
                    <Pencil size={16} /> Tahrirlash
                  </button>

                  <button
                    type="button"
                    style={dangerButton}
                    onClick={() => deleteAnnouncement(item.id)}
                  >
                    <Trash2 size={16} /> O'chirish
                  </button>
                </div>
              </div>
            ))}

            {!announcements.length && (
              <div style={cardStyle}>
                Hozircha e'lonlar yo'q.
              </div>
            )}
          </>
        )}

        {tab === "dashboard" && (
          <>
            <h3>Umumiy statistika</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                gap: 12
              }}
            >
              <div style={cardStyle}>
                <Headphones color="#a78bfa" />
                <h2>{totalPlays.toLocaleString()}</h2>
                <div style={{ color: "#aaa" }}>Jami tinglanishlar</div>
              </div>

              <div style={cardStyle}>
                <Music color="#a78bfa" />
                <h2>{publishedSongs.length}</h2>
                <div style={{ color: "#aaa" }}>Musiqalar</div>
              </div>

              <div style={cardStyle}>
                <ListMusic color="#a78bfa" />
                <h2>{playlists.length}</h2>
                <div style={{ color: "#aaa" }}>Playlistlar</div>
              </div>

              <div style={cardStyle}>
                <Activity color="#a78bfa" />
                <h2>{pendingSongs.length}</h2>
                <div style={{ color: "#aaa" }}>Tekshiruvda</div>
              </div>

              <div style={cardStyle}>
                <Megaphone color="#a78bfa" />
                <h2>{announcements.filter(item => item.is_active).length}</h2>
                <div style={{ color: "#aaa" }}>Faol e'lonlar</div>
              </div>
            </div>

            <h3 style={{ marginTop: 28 }}>
              <TrendingUp size={19} style={{ verticalAlign: "middle" }} /> TOP 10 musiqa
            </h3>

            {topSongs.length ? (
              topSongs.map((song, index) => (
                <div
                  key={song.id}
                  style={{
                    ...cardStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8
                  }}
                >
                  <strong style={{ color: "#a78bfa", minWidth: 25 }}>
                    {index + 1}.
                  </strong>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{song.title}</div>
                    <div style={{ color: "#aaa", fontSize: 13 }}>
                      {song.artist}
                    </div>
                  </div>

                  <div style={{ whiteSpace: "nowrap", color: "#c4b5fd" }}>
                    <Play size={14} style={{ verticalAlign: "middle" }} />{" "}
                    {Number(song.play_count) || 0}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#999" }}>Hozircha musiqa yo'q.</p>
            )}

            <h3 style={{ marginTop: 28 }}>TOP 10 ijrochi</h3>

            {artistStats.length ? (
              artistStats.map((item, index) => (
                <div
                  key={item.name}
                  style={{
                    ...cardStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8
                  }}
                >
                  <strong style={{ color: "#a78bfa" }}>{index + 1}.</strong>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ color: "#aaa", fontSize: 12 }}>
                      {item.songs} ta musiqa
                    </div>
                  </div>

                  <strong style={{ color: "#c4b5fd" }}>
                    {item.plays.toLocaleString()}
                  </strong>
                </div>
              ))
            ) : (
              <p style={{ color: "#999" }}>Ijrochilar hali yo'q.</p>
            )}
          </>
        )}

        {tab === "playlists" && (
          <>
            {selectedPlaylist ? (
              <>
                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: "#302b3d",
                    color: "white",
                    marginBottom: 16
                  }}
                  onClick={() => setSelectedPlaylist(null)}
                >
                  <ArrowLeft size={16} /> Orqaga
                </button>

                <h3>{selectedPlaylist.name || "Playlist"}</h3>

                <p style={{ color: "#aaa", fontSize: 13 }}>
                  Egasi: {selectedPlaylist.user_id || "-"}
                </p>

                <p style={{ color: "#aaa" }}>
                  Musiqalar: {selectedPlaylistSongs.length}
                </p>

                {selectedPlaylistSongs.length ? (
                  selectedPlaylistSongs.map(song => renderSong(song))
                ) : (
                  <p style={{ color: "#999" }}>
                    Playlistda musiqa topilmadi.
                  </p>
                )}
              </>
            ) : (
              <>
                <h3>Playlistlar ({playlists.length})</h3>

                {playlists.map(playlist => {
                  const count = playlistSongs.filter(
                    item => item.playlist_id === playlist.id
                  ).length;

                  return (
                    <button
                      type="button"
                      key={playlist.id}
                      onClick={() => openPlaylist(playlist)}
                      style={{
                        ...cardStyle,
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        color: "white",
                        textAlign: "left",
                        marginBottom: 10,
                        cursor: "pointer"
                      }}
                    >
                      <ListMusic color="#a78bfa" size={26} />

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>
                          {playlist.name || "Nomsiz playlist"}
                        </div>
                        <div style={{ color: "#aaa", fontSize: 12 }}>
                          {count} ta musiqa
                        </div>
                      </div>

                      <ChevronRight />
                    </button>
                  );
                })}

                {!playlists.length && (
                  <p style={{ color: "#999" }}>Playlistlar mavjud emas.</p>
                )}
              </>
            )}
          </>
        )}

        {tab === "music" && (
          <>
            <h3>Yangi musiqa yuklash</h3>

            <form
              onSubmit={uploadSingle}
              style={{ ...cardStyle, marginBottom: 18 }}
            >
              <label>Musiqa nomi</label>
              <input
                style={inputStyle}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Musiqa nomi"
                required
              />

              <label>Ijrochi</label>
              <input
                style={inputStyle}
                value={artist}
                onChange={e => setArtist(e.target.value)}
                placeholder="Ijrochi nomi"
                required
              />

              <label>Janr</label>
              <select
                style={inputStyle}
                value={genre}
                onChange={e => setGenre(e.target.value)}
              >
                {["Pop", "Rap", "Hip-Hop", "Rock", "Electronic", "R&B", "Other"].map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <label>Audio fayl</label>
              <input
                id="single-audio"
                type="file"
                style={fileInputStyle}
                onChange={e => setAudioFile(e.target.files?.[0] || null)}
                required
              />

              <label>Muqova rasmi (ixtiyoriy)</label>
              <input
                id="single-cover"
                type="file"
                accept="image/*"
                style={fileInputStyle}
                onChange={e => setCoverFile(e.target.files?.[0] || null)}
              />

              <button
                type="submit"
                style={{ ...primaryButton, width: "100%" }}
                disabled={uploading}
              >
                <Upload size={17} />
                {uploading ? "Yuklanmoqda..." : "Musiqani yuklash"}
              </button>
            </form>

            <h3>Ko'p musiqa yuklash</h3>

            <div style={{ ...cardStyle, marginBottom: 22 }}>
              <label>Audio fayllar</label>

              <input
                id="bulk-audio"
                type="file"
                multiple
                style={fileInputStyle}
                onChange={e => setBulkFiles(Array.from(e.target.files || []))}
              />

              <div style={{ color: "#aaa", fontSize: 12, marginBottom: 12 }}>
                Tanlangan fayllar: {bulkFiles.length} ta
              </div>

              <label>Ijrochi</label>
              <input
                style={inputStyle}
                value={bulkArtist}
                onChange={e => setBulkArtist(e.target.value)}
                placeholder="Ijrochi nomi"
              />

              <label>Janr</label>
              <select
                style={inputStyle}
                value={bulkGenre}
                onChange={e => setBulkGenre(e.target.value)}
              >
                {["Pop", "Rap", "Hip-Hop", "Rock", "Electronic", "R&B", "Other"].map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <label>Umumiy muqova rasmi (ixtiyoriy)</label>
              <input
                id="bulk-cover"
                type="file"
                accept="image/*"
                style={fileInputStyle}
                onChange={e => setBulkCover(e.target.files?.[0] || null)}
              />

              {bulkUploading && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      height: 8,
                      background: "#302b3d",
                      borderRadius: 20,
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        width: `${bulkProgress}%`,
                        height: "100%",
                        background: "#8b5cf6"
                      }}
                    />
                  </div>

                  <p style={{ color: "#aaa", fontSize: 12 }}>
                    {bulkProgress}% bajarildi
                  </p>
                </div>
              )}

              <button
                type="button"
                style={{ ...primaryButton, width: "100%" }}
                onClick={uploadBulk}
                disabled={bulkUploading}
              >
                <Upload size={17} />
                {bulkUploading ? "Yuklanmoqda..." : "Barchasini yuklash"}
              </button>
            </div>

            <h3>Yuklangan musiqalar ({publishedSongs.length})</h3>

            {publishedSongs.map(song => renderSong(song))}

            {!publishedSongs.length && (
              <p style={{ color: "#999" }}>Hozircha musiqa yo'q.</p>
            )}
          </>
        )}

        {tab === "pending" && (
          <>
            <h3>Tekshiruvdagi musiqalar ({pendingSongs.length})</h3>

            {pendingSongs.length ? (
              pendingSongs.map(song => renderSong(song, true))
            ) : (
              <div style={cardStyle}>
                <Check color="#22c55e" size={30} />
                <p>Tekshiruvda musiqa yo'q.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#100e16",
  color: "white",
  fontFamily: "Arial, sans-serif",
  paddingBottom: 40
};
