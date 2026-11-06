
import React, { useEffect, useState } from "react";
import {
  ArrowLeft, Music, Trash2, Upload, LogOut,
  RefreshCw, Headphones, ListMusic,
  ChevronRight, TrendingUp, Play, Check, X,
  Pencil, Save, Users, UserPlus, Activity,
  Search, CalendarDays
} from "lucide-react";
import { supabase } from "./supabase";

function getStoragePath(url) {
  if (!url) return null;
  const marker = "/storage/v1/object/public/music/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.substring(index + marker.length).split("?")[0]);
}

function formatDate(value) {
  if (!value) return "Ma'lumot yo'q";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Ma'lumot yo'q";

  return date.toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function Admin({ onClose }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [songs, setSongs] = useState([]);
  const [users, setUsers] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistRelations, setPlaylistRelations] = useState([]);

  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedPlaylistSongs, setSelectedPlaylistSongs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [singleUploading, setSingleUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [audioFiles, setAudioFiles] = useState([]);
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("Boshqa");
  const [coverFile, setCoverFile] = useState(null);

  const [singleAudio, setSingleAudio] = useState(null);
  const [singleTitle, setSingleTitle] = useState("");
  const [singleArtist, setSingleArtist] = useState("");
  const [singleGenre, setSingleGenre] = useState("Boshqa");
  const [singleCover, setSingleCover] = useState(null);

  const [activeSection, setActiveSection] = useState("dashboard");

  const [songCount, setSongCount] = useState(0);
  const [playlistCount, setPlaylistCount] = useState(0);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");

  // Yangi foydalanuvchilar statistikasi
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();

    if (!data.session) return;

    const { data: admin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", data.session.user.id)
      .maybeSingle();

    if (admin) {
      setSession(data.session);
      await loadData();
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
      setError("Email yoki parol noto'g'ri.");
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
      setError("Sizda admin huquqi yo'q.");
      setLoading(false);
      return;
    }

    setSession(data.session);
    setLoading(false);
    await loadData();
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setSelectedPlaylist(null);
  }

  async function loadData() {
    setLoading(true);
    setError("");

    const [
      songsResult,
      usersResult,
      playlistsResult,
      relationsResult,
      songCountResult,
      playlistCountResult
    ] = await Promise.all([
      supabase.from("songs")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase.from("app_users")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase.from("playlists")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase.from("playlist_songs")
        .select("playlist_id, song_id"),

      supabase.from("songs")
        .select("id", { count: "exact", head: true }),

      supabase.from("playlists")
        .select("id", { count: "exact", head: true })
    ]);

    if (songsResult.error) {
      setError("Musiqalarni yuklash: " + songsResult.error.message);
    } else {
      setSongs(songsResult.data || []);
    }

    if (usersResult.error) {
      setUsers([]);
      setError(prev =>
        prev
          ? prev + " | Foydalanuvchilar: " + usersResult.error.message
          : "Foydalanuvchilarni yuklash: " + usersResult.error.message
      );
    } else {
      setUsers(usersResult.data || []);
    }

    if (playlistsResult.error) {
      setError("Playlistlarni yuklash: " + playlistsResult.error.message);
    } else {
      setPlaylists(playlistsResult.data || []);
    }

    if (relationsResult.error) {
      setError("Playlist musiqalari: " + relationsResult.error.message);
    } else {
      setPlaylistRelations(relationsResult.data || []);
    }

    setSongCount(songCountResult.count || 0);
    setPlaylistCount(playlistCountResult.count || 0);
    setLoading(false);
  }

  async function openPlaylist(playlist) {
    setSelectedPlaylist(playlist);
    setSelectedPlaylistSongs([]);

    const relations = playlistRelations.filter(
      item => item.playlist_id === playlist.id
    );

    const ids = relations.map(item => item.song_id);
    if (!ids.length) return;

    const { data, error } = await supabase
      .from("songs")
      .select("id, title, artist, cover_url")
      .in("id", ids);

    if (error) {
      setError("Playlist musiqalarini ochib bo'lmadi: " + error.message);
      return;
    }

    setSelectedPlaylistSongs(data || []);
  }

  async function deleteSong(song) {
    const confirmed = window.confirm(
      `"${song.title}" musiqasini o'chirmoqchimisiz?`
    );

    if (!confirmed) return;

    setBusyId(song.id);
    setMessage("");
    setError("");

    const { error: deleteError } = await supabase
      .from("songs")
      .delete()
      .eq("id", song.id);

    if (deleteError) {
      setError("Bazadan o'chirilmadi: " + deleteError.message);
      setBusyId(null);
      return;
    }

    setSongs(prev => prev.filter(item => item.id !== song.id));
    setSongCount(prev => Math.max(0, prev - 1));

    const paths = [
      getStoragePath(song.audio_url),
      getStoragePath(song.cover_url)
    ].filter(Boolean);

    if (paths.length) {
      const { error: storageError } = await supabase.storage
        .from("music")
        .remove(paths);

      if (storageError) {
        setMessage(
          "Musiqa bazadan o'chirildi, Storage xatosi: " +
          storageError.message
        );
      } else {
        setMessage("Musiqa muvaffaqiyatli o'chirildi!");
      }
    } else {
      setMessage("Musiqa muvaffaqiyatli o'chirildi!");
    }

    setBusyId(null);
  }

  async function approveSong(song) {
    setBusyId(song.id);
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("songs")
      .update({ is_published: true })
      .eq("id", song.id);

    if (error) {
      setError("Tasdiqlashda xatolik: " + error.message);
    } else {
      setSongs(prev => prev.map(item =>
        item.id === song.id
          ? { ...item, is_published: true }
          : item
      ));

      setMessage(`"${song.title}" tasdiqlandi!`);
    }

    setBusyId(null);
  }

  async function rejectSong(song) {
    const confirmed = window.confirm(
      `"${song.title}" musiqasini rad etib, o'chirasizmi?`
    );

    if (!confirmed) return;
    await deleteSong(song);
  }

  function startEditing(song) {
    setEditingId(song.id);
    setEditTitle(song.title || "");
    setEditArtist(song.artist || "");
    setError("");
    setMessage("");
  }

  async function saveSongEdit(song) {
    if (!editTitle.trim() || !editArtist.trim()) {
      setError("Musiqa nomi va ijrochisini kiriting.");
      return;
    }

    setBusyId(song.id);
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("songs")
      .update({
        title: editTitle.trim(),
        artist: editArtist.trim()
      })
      .eq("id", song.id);

    if (error) {
      setError("Tahrirlashda xatolik: " + error.message);
    } else {
      setSongs(prev => prev.map(item =>
        item.id === song.id
          ? {
              ...item,
              title: editTitle.trim(),
              artist: editArtist.trim()
            }
          : item
      ));

      setEditingId(null);
      setMessage("Musiqa ma'lumotlari saqlandi!");
    }

    setBusyId(null);
  }

  async function uploadSingle(e) {
    e.preventDefault();

    if (!singleAudio || !singleTitle.trim() || !singleArtist.trim()) {
      setError("Musiqa fayli, nomi va ijrochisini kiriting.");
      return;
    }

    setSingleUploading(true);
    setError("");
    setMessage("");

    try {
      const audioPath =
        "audio/" + Date.now() + "_" + safeName(singleAudio.name);

      const { error: audioError } = await supabase.storage
        .from("music")
        .upload(audioPath, singleAudio, {
          contentType: singleAudio.type || "audio/mpeg",
          upsert: false
        });

      if (audioError) throw audioError;

      const { data: audioData } = supabase.storage
        .from("music")
        .getPublicUrl(audioPath);

      let coverUrl = null;

      if (singleCover) {
        const coverPath =
          "covers/" + Date.now() + "_" + safeName(singleCover.name);

        const { error: coverError } = await supabase.storage
          .from("music")
          .upload(coverPath, singleCover, {
            contentType: singleCover.type || "image/jpeg",
            upsert: false
          });

        if (coverError) throw coverError;

        const { data: coverData } = supabase.storage
          .from("music")
          .getPublicUrl(coverPath);

        coverUrl = coverData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("songs")
        .insert({
          title: singleTitle.trim(),
          artist: singleArtist.trim(),
          genre: singleGenre,
          audio_url: audioData.publicUrl,
          cover_url: coverUrl,
          is_published: true
        });

      if (insertError) throw insertError;

      setMessage("Musiqa muvaffaqiyatli qo'shildi!");
      setSingleAudio(null);
      setSingleTitle("");
      setSingleArtist("");
      setSingleGenre("Boshqa");
      setSingleCover(null);

      await loadData();
    } catch (err) {
      setError("Musiqa yuklanmadi: " + err.message);
    }

    setSingleUploading(false);
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
    const totalFiles = audioFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = audioFiles[i];

      const audioPath =
        "audio/" + Date.now() + "_" + i + "_" +
        safeName(file.name.replace(/\.[^/.]+$/, ""));

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
            safeName(coverFile.name);

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

      setProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setUploading(false);
    setAudioFiles([]);
    setCoverFile(null);

    if (success > 0) {
      setMessage(`${success} ta musiqa yuklandi!`);
      await loadData();
    }

    if (success < totalFiles) {
      setError(
        "Ayrim musiqalar yuklanmadi. Supabase sozlamalarini tekshiring."
      );
    }
  }

  // STATISTIKA HISOBLASH

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const weekStart = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  );

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const totalUsers = users.length;

  const todayUsers = users.filter(user =>
    user.created_at &&
    new Date(user.created_at) >= todayStart
  ).length;

  const monthUsers = users.filter(user =>
    user.created_at &&
    new Date(user.created_at) >= monthStart
  ).length;

  const activeToday = users.filter(user =>
    user.last_seen &&
    new Date(user.last_seen) >= todayStart
  ).length;

  const activeWeek = users.filter(user =>
    user.last_seen &&
    new Date(user.last_seen) >= weekStart
  ).length;

  const pendingSongs = songs.filter(
    song => song.is_published === false && song.submitted_by
  );

  const publishedSongs = songs.filter(
    song => song.is_published === true
  );

  const totalPlays = publishedSongs.reduce(
    (sum, song) => sum + Number(song.play_count || 0),
    0
  );

  const topSongs = [...publishedSongs]
    .sort((a, b) =>
      Number(b.play_count || 0) - Number(a.play_count || 0)
    )
    .slice(0, 10);

  const artistStats = Object.values(
    publishedSongs.reduce((result, song) => {
      const name = (song.artist || "Noma'lum").trim();
      const key = name.toLowerCase();

      if (!result[key]) {
        result[key] = { name, plays: 0, songs: 0 };
      }

      result[key].plays += Number(song.play_count || 0);
      result[key].songs += 1;

      return result;
    }, {})
  )
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  const recentUsers = [...users]
    .sort((a, b) =>
      new Date(b.created_at || 0) -
      new Date(a.created_at || 0)
    )
    .slice(0, 10);

  const filteredUsers = [...users]
    .filter(user => {
      const search = userSearch.trim().toLowerCase();

      const matchesSearch =
        !search ||
        String(user.id || "").toLowerCase().includes(search) ||
        String(user.username || "").toLowerCase().includes(search) ||
        String(user.display_name || "").toLowerCase().includes(search);

      const lastSeen = user.last_seen
        ? new Date(user.last_seen)
        : null;

      let matchesFilter = true;

      if (userFilter === "today") {
        matchesFilter = lastSeen && lastSeen >= todayStart;
      } else if (userFilter === "week") {
        matchesFilter = lastSeen && lastSeen >= weekStart;
      } else if (userFilter === "new") {
        matchesFilter =
          user.created_at &&
          new Date(user.created_at) >= todayStart;
      }

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) =>
      new Date(b.created_at || 0) -
      new Date(a.created_at || 0)
    );

  const userMap = {};

  users.forEach(user => {
    userMap[user.id] = user;
  });

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

  const smallButton = {
    border: 0,
    background: "#302a40",
    color: "white",
    borderRadius: 9,
    padding: 9,
    cursor: "pointer"
  };

  const sectionButton = id => ({
    flex: 1,
    minWidth: 0,
    border: activeSection === id
      ? "1px solid #a78bfa"
      : "1px solid #302a40",
    background: activeSection === id ? "#302344" : "#191724",
    color: "white",
    padding: "11px 5px",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer"
  });

  function renderSong(song, showSubmitter = false) {
    const owner = song.submitted_by
      ? userMap[song.submitted_by]
      : null;

    return (
      <div key={song.id} style={{
        padding: 13,
        borderBottom: "1px solid #302a40"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          {song.cover_url ? (
            <img
              src={song.cover_url}
              alt=""
              style={{
                width: 48,
                height: 48,
                borderRadius: 9,
                objectFit: "cover",
                flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 9,
              background: "#302344",
              display: "grid",
              placeItems: "center",
              flexShrink: 0
            }}>
              <Music size={23} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            {editingId === song.id ? (
              <>
                <input
                  style={{ ...input, marginBottom: 5 }}
                  value={editTitle}
                  placeholder="Musiqa nomi"
                  onChange={e => setEditTitle(e.target.value)}
                />
                <input
                  style={{ ...input, marginTop: 5, marginBottom: 5 }}
                  value={editArtist}
                  placeholder="Ijrochi"
                  onChange={e => setEditArtist(e.target.value)}
                />
              </>
            ) : (
              <>
                <b style={{
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {song.title}
                </b>
                <small style={{ color: "#aaa" }}>{song.artist}</small>
              </>
            )}
          </div>
        </div>

        {showSubmitter && (
          <div style={{
            marginTop: 10,
            padding: 10,
            background: "#100e18",
            borderRadius: 9
          }}>
            <small style={{ color: "#a78bfa" }}>
              Yuborgan foydalanuvchi
            </small>

            <p style={{ margin: "5px 0", fontWeight: 700 }}>
              {owner?.display_name || "Noma'lum foydalanuvchi"}
            </p>

            {owner?.username && (
              <small style={{ color: "#aaa" }}>
                @{owner.username}
              </small>
            )}

            <small style={{
              display: "block",
              color: "#777",
              fontSize: 10,
              wordBreak: "break-all",
              marginTop: 4
            }}>
              ID: {song.submitted_by}
            </small>

            <small style={{
              display: "block",
              color: "#777",
              marginTop: 5
            }}>
              Yuborilgan: {formatDate(song.created_at)}
            </small>
          </div>
        )}

        {song.audio_url && (
          <audio
            controls
            preload="none"
            src={song.audio_url}
            style={{
              width: "100%",
              height: 38,
              marginTop: 10
            }}
          />
        )}

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
          marginTop: 10
        }}>
          {editingId === song.id ? (
            <>
              <button
                disabled={busyId === song.id}
                onClick={() => saveSongEdit(song)}
                style={{
                  ...smallButton,
                  background: "#176b43",
                  display: "flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <Save size={15} /> Saqlash
              </button>

              <button
                onClick={() => setEditingId(null)}
                style={smallButton}
              >
                Bekor qilish
              </button>
            </>
          ) : (
            <button
              onClick={() => startEditing(song)}
              style={{
                ...smallButton,
                display: "flex",
                alignItems: "center",
                gap: 5
              }}
            >
              <Pencil size={15} /> Tahrirlash
            </button>
          )}

          {showSubmitter && (
            <>
              <button
                disabled={busyId === song.id}
                onClick={() => approveSong(song)}
                style={{
                  ...smallButton,
                  background: "#176b43",
                  display: "flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <Check size={15} /> Tasdiqlash
              </button>

              <button
                disabled={busyId === song.id}
                onClick={() => rejectSong(song)}
                style={{
                  ...smallButton,
                  background: "#672a35",
                  color: "#ff9ba5",
                  display: "flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <X size={15} /> Rad etish
              </button>
            </>
          )}

          <button
            disabled={busyId === song.id}
            onClick={() => deleteSong(song)}
            style={{
              ...smallButton,
              background: "#4a202b",
              color: "#ff6b7a",
              display: "flex",
              alignItems: "center",
              gap: 5
            }}
          >
            <Trash2 size={15} /> O'chirish
          </button>
        </div>
      </div>
    );
  }

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
        maxWidth: 650,
        margin: "0 auto",
        paddingBottom: 50
      }}>

        {/* HEADER */}

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20
        }}>
          <button onClick={onClose} style={smallButton}>
            <ArrowLeft size={20} />
          </button>

          <h2 style={{ margin: 0, fontSize: 20 }}>
            Espofiy Admin
          </h2>

          {session && (
            <button onClick={logout} style={smallButton}>
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

            {error && (
              <p style={{ color: "#ff7777" }}>{error}</p>
            )}

            <button style={button} disabled={loading}>
              {loading ? "Kutilmoqda..." : "Kirish"}
            </button>
          </form>
        ) : (
          <>
            {/* NAVIGATION */}

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 7,
              marginBottom: 18
            }}>
              <button
                style={sectionButton("dashboard")}
                onClick={() => setActiveSection("dashboard")}
              >
                <Headphones size={15} />
                <br />Boshqaruv
              </button>

              <button
                style={sectionButton("users")}
                onClick={() => {
                  setActiveSection("users");
                  setUserSearch("");
                  setUserFilter("all");
                }}
              >
                <Users size={15} />
                <br />Users ({totalUsers})
              </button>

              <button
                style={sectionButton("playlists")}
                onClick={() => {
                  setActiveSection("playlists");
                  setSelectedPlaylist(null);
                }}
              >
                <ListMusic size={15} />
                <br />Playlistlar
              </button>

              <button
                style={sectionButton("songs")}
                onClick={() => setActiveSection("songs")}
              >
                <Music size={15} />
                <br />Musiqa
              </button>

              <button
                style={sectionButton("pending")}
                onClick={() => setActiveSection("pending")}
              >
                <Activity size={15} />
                <br />Tekshiruv ({pendingSongs.length})
              </button>

              <button
                style={sectionButton("dashboard")}
                onClick={loadData}
              >
                <RefreshCw size={15} />
                <br />Yangilash
              </button>
            </div>

            {/* DASHBOARD */}

            {activeSection === "dashboard" && (
              <>
                <h3 style={{ marginTop: 0 }}>
                  Umumiy statistika
                </h3>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10
                }}>
                  <div style={card}>
                    <Users color="#a78bfa" />
                    <h2>{totalUsers.toLocaleString("uz-UZ")}</h2>
                    <small>Foydalanuvchilar</small>
                  </div>

                  <div style={card}>
                    <Headphones color="#a78bfa" />
                    <h2>{totalPlays.toLocaleString("uz-UZ")}</h2>
                    <small>Jami tinglashlar</small>
                  </div>

                  <div style={card}>
                    <Music color="#a78bfa" />
                    <h2>{publishedSongs.length}</h2>
                    <small>Chiqarilgan musiqalar</small>
                  </div>

                  <div style={card}>
                    <ListMusic color="#a78bfa" />
                    <h2>{playlistCount}</h2>
                    <small>Playlistlar</small>
                  </div>
                </div>

                {/* USER STATS */}

                <div style={card}>
                  <h3 style={{ marginTop: 0 }}>
                    <Users
                      size={18}
                      style={{ verticalAlign: "middle" }}
                    /> Foydalanuvchilar statistikasi
                  </h3>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10
                  }}>
                    {[
                      {
                        title: "Jami foydalanuvchilar",
                        value: totalUsers,
                        icon: <Users color="#a78bfa" />
                      },
                      {
                        title: "Bugun qo'shilganlar",
                        value: todayUsers,
                        icon: <UserPlus color="#34d399" />
                      },
                      {
                        title: "Bugun faol",
                        value: activeToday,
                        icon: <Activity color="#38bdf8" />
                      },
                      {
                        title: "7 kunda faol",
                        value: activeWeek,
                        icon: <TrendingUp color="#fbbf24" />
                      },
                      {
                        title: "Shu oy qo'shilgan",
                        value: monthUsers,
                        icon: <CalendarDays color="#c084fc" />
                      }
                    ].map(item => (
                      <div key={item.title} style={{
                        background: "#100e18",
                        border: "1px solid #302a40",
                        borderRadius: 12,
                        padding: 13
                      }}>
                        {item.icon}

                        <h2 style={{
                          margin: "8px 0",
                          color: "#c4a8ff"
                        }}>
                          {item.value.toLocaleString("uz-UZ")}
                        </h2>

                        <small style={{ color: "#aaa" }}>
                          {item.title}
                        </small>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveSection("users")}
                    style={{ ...button, marginTop: 14 }}
                  >
                    Barcha foydalanuvchilarni ko'rish
                  </button>
                </div>

                {/* TOP SONGS */}

                <div style={card}>
                  <h3 style={{ marginTop: 0 }}>
                    <Play
                      size={17}
                      style={{ verticalAlign: "middle" }}
                    /> TOP 10 qo'shiqlar
                  </h3>

                  {topSongs.map((song, index) => (
                    <div key={song.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 0",
                      borderBottom: "1px solid #302a40"
                    }}>
                      <b style={{
                        color: "#a78bfa",
                        width: 22,
                        flexShrink: 0
                      }}>
                        {index + 1}.
                      </b>

                      {song.cover_url ? (
                        <img
                          src={song.cover_url}
                          alt=""
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 8,
                            objectFit: "cover"
                          }}
                        />
                      ) : <Music size={22} />}

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

                      <small style={{
                        color: "#c4a8ff",
                        whiteSpace: "nowrap"
                      }}>
                        {Number(song.play_count || 0).toLocaleString("uz-UZ")} ta
                      </small>
                    </div>
                  ))}

                  {topSongs.length === 0 && (
                    <p style={{ color: "#aaa" }}>
                      Hozircha musiqa yo'q.
                    </p>
                  )}
                </div>

                {/* TOP ARTISTS */}

                <div style={card}>
                  <h3 style={{ marginTop: 0 }}>
                    <TrendingUp
                      size={17}
                      style={{ verticalAlign: "middle" }}
                    /> Eng mashhur ijrochilar
                  </h3>

                  {artistStats.map((item, index) => (
                    <div key={item.name} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 0",
                      borderBottom: "1px solid #302a40"
                    }}>
                      <b style={{
                        color: "#a78bfa",
                        width: 22
                      }}>
                        {index + 1}.
                      </b>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b>{item.name}</b>
                        <small style={{
                          display: "block",
                          color: "#aaa",
                          marginTop: 3
                        }}>
                          {item.songs} ta musiqa
                        </small>
                      </div>

                      <small style={{ color: "#c4a8ff" }}>
                        {item.plays.toLocaleString("uz-UZ")} tinglash
                      </small>
                    </div>
                  ))}

                  {artistStats.length === 0 && (
                    <p style={{ color: "#aaa" }}>
                      Hozircha ijrochilar yo'q.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* USERS SECTION */}

            {activeSection === "users" && (
              <>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14
                }}>
                  <h3 style={{ margin: 0 }}>
                    <Users
                      size={19}
                      style={{ verticalAlign: "middle" }}
                    /> Foydalanuvchilar
                  </h3>

                  <button
                    onClick={loadData}
                    disabled={loading}
                    style={smallButton}
                  >
                    <RefreshCw size={17} />
                  </button>
                </div>

                {/* USER CARDS */}

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10
                }}>
                  {[
                    {
                      title: "Jami",
                      value: totalUsers,
                      color: "#a78bfa",
                      icon: <Users />
                    },
                    {
                      title: "Bugun yangi",
                      value: todayUsers,
                      color: "#34d399",
                      icon: <UserPlus />
                    },
                    {
                      title: "Bugun faol",
                      value: activeToday,
                      color: "#38bdf8",
                      icon: <Activity />
                    },
                    {
                      title: "Haftalik faol",
                      value: activeWeek,
                      color: "#fbbf24",
                      icon: <TrendingUp />
                    }
                  ].map(item => (
                    <div key={item.title} style={{
                      ...card,
                      marginBottom: 0
                    }}>
                      <div style={{ color: item.color }}>
                        {item.icon}
                      </div>

                      <h2 style={{
                        color: item.color,
                        margin: "8px 0"
                      }}>
                        {item.value.toLocaleString("uz-UZ")}
                      </h2>

                      <small style={{ color: "#aaa" }}>
                        {item.title}
                      </small>
                    </div>
                  ))}
                </div>

                {/* SEARCH */}

                <div style={{
                  ...card,
                  marginTop: 14
                }}>
                  <h3 style={{ marginTop: 0 }}>
                    <Search
                      size={17}
                      style={{ verticalAlign: "middle" }}
                    /> Qidirish
                  </h3>

                  <input
                    style={input}
                    placeholder="Ism, username yoki Telegram ID..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8
                  }}>
                    {[
                      ["all", "Hammasi"],
                      ["today", "Bugun faol"],
                      ["week", "7 kun faol"],
                      ["new", "Bugun yangi"]
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setUserFilter(value)}
                        style={{
                          padding: 10,
                          borderRadius: 9,
                          border: userFilter === value
                            ? "1px solid #a78bfa"
                            : "1px solid #393247",
                          background: userFilter === value
                            ? "#302344"
                            : "#100e18",
                          color: "white",
                          cursor: "pointer"
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <p style={{
                    color: "#aaa",
                    fontSize: 12,
                    marginBottom: 0
                  }}>
                    Topildi: {filteredUsers.length} / {totalUsers}
                  </p>
                </div>

                {/* RECENT USERS */}

                <div style={card}>
                  <h3 style={{ marginTop: 0 }}>
                    <UserPlus
                      size={17}
                      style={{ verticalAlign: "middle" }}
                    /> Oxirgi qo'shilganlar
                  </h3>

                  {recentUsers.map(user => (
                    <div key={user.id} style={{
                      background: "#100e18",
                      border: "1px solid #302a40",
                      borderRadius: 11,
                      padding: 12,
                      marginBottom: 9
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10
                      }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          background: "#302344",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0
                        }}>
                          <Users size={20} color="#c4a8ff" />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b>{user.display_name || "Noma'lum"}</b>

                          <small style={{
                            display: "block",
                            color: "#a78bfa",
                            marginTop: 3
                          }}>
                            {user.username
                              ? "@" + user.username
                              : "Username yo'q"}
                          </small>
                        </div>

                        <span style={{
                          color: "#34d399",
                          fontSize: 11
                        }}>
                          Yangi
                        </span>
                      </div>

                      <small style={{
                        display: "block",
                        color: "#888",
                        marginTop: 10,
                        wordBreak: "break-all"
                      }}>
                        Telegram ID: {user.id}
                      </small>

                      <small style={{
                        display: "block",
                        color: "#888",
                        marginTop: 5
                      }}>
                        Ro'yxatdan o'tgan: {formatDate(user.created_at)}
                      </small>

                      <small style={{
                        display: "block",
                        color: "#34d399",
                        marginTop: 5
                      }}>
                        Oxirgi kirish: {formatDate(user.last_seen)}
                      </small>
                    </div>
                  ))}

                  {recentUsers.length === 0 && (
                    <p style={{ color: "#aaa" }}>
                      Foydalanuvchilar topilmadi.
                    </p>
                  )}
                </div>

                {/* ALL USERS */}

                <div style={card}>
                  <h3 style={{ marginTop: 0 }}>
                    Barcha foydalanuvchilar
                  </h3>

                  {filteredUsers.map(user => (
                    <div key={user.id} style={{
                      padding: 13,
                      borderBottom: "1px solid #302a40"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10
                      }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: "#302344",
                          display: "grid",
                          placeItems: "center"
                        }}>
                          <Users size={18} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b>
                            {user.display_name || "Noma'lum foydalanuvchi"}
                          </b>

                          <small style={{
                            display: "block",
                            color: "#a78bfa",
                            marginTop: 3
                          }}>
                            {user.username
                              ? "@" + user.username
                              : "Username mavjud emas"}
                          </small>
                        </div>
                      </div>

                      <small style={{
                        display: "block",
                        color: "#888",
                        marginTop: 9,
                        wordBreak: "break-all"
                      }}>
                        Telegram ID: {user.id}
                      </small>

                      <small style={{
                        display: "block",
                        color: "#888",
                        marginTop: 5
                      }}>
                        Qo'shilgan: {formatDate(user.created_at)}
                      </small>

                      <small style={{
                        display: "block",
                        color: "#34d399",
                        marginTop: 5
                      }}>
                        Oxirgi kirish: {formatDate(user.last_seen)}
                      </small>
                    </div>
                  ))}

                  {filteredUsers.length === 0 && (
                    <p style={{
                      color: "#aaa",
                      textAlign: "center"
                    }}>
                      Foydalanuvchilar topilmadi.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* PENDING SONGS */}

            {activeSection === "pending" && (
              <>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14
                }}>
                  <h3 style={{ margin: 0 }}>
                    Yangi yuborilgan musiqalar
                  </h3>

                  <button onClick={loadData} style={smallButton}>
                    <RefreshCw size={17} />
                  </button>
                </div>

                <div style={{
                  ...card,
                  borderColor: "#6b5124"
                }}>
                  <p style={{
                    margin: 0,
                    color: "#fbbf24"
                  }}>
                    Tekshiruvda: {pendingSongs.length} ta musiqa
                  </p>

                  <small style={{ color: "#aaa" }}>
                    Musiqani tasdiqlasangiz, u barcha foydalanuvchilarga ko'rinadi.
                  </small>
                </div>

                <div style={card}>
                  {pendingSongs.map(song => renderSong(song, true))}

                  {pendingSongs.length === 0 && (
                    <p style={{
                      color: "#aaa",
                      textAlign: "center"
                    }}>
                      Hozircha tekshiruvda musiqa yo'q.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* PLAYLISTS */}

            {activeSection === "playlists" && (
              <>
                {selectedPlaylist ? (
                  <>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 15
                    }}>
                      <button
                        onClick={() => setSelectedPlaylist(null)}
                        style={smallButton}
                      >
                        <ArrowLeft size={18} />
                      </button>

                      <div>
                        <h3 style={{ margin: 0 }}>
                          {selectedPlaylist.name}
                        </h3>

                        <small style={{ color: "#aaa" }}>
                          {selectedPlaylistSongs.length} ta musiqa
                        </small>
                      </div>
                    </div>

                    <div style={card}>
                      <p style={{ color: "#aaa" }}>
                        Playlist egasi:
                      </p>

                      <b>
                        {userMap[selectedPlaylist.user_id]?.display_name ||
                          "Noma'lum foydalanuvchi"}
                      </b>

                      <p style={{
                        color: "#aaa",
                        fontSize: 12,
                        wordBreak: "break-all"
                      }}>
                        ID: {selectedPlaylist.user_id || "Mavjud emas"}
                      </p>

                      <p style={{ color: "#aaa" }}>
                        Yaratilgan: {formatDate(selectedPlaylist.created_at)}
                      </p>
                    </div>

                    <div style={card}>
                      <h3>Playlist ichidagi musiqalar</h3>

                      {selectedPlaylistSongs.map(song => (
                        <div key={song.id} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 0",
                          borderBottom: "1px solid #302a40"
                        }}>
                          {song.cover_url ? (
                            <img
                              src={song.cover_url}
                              alt=""
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 8,
                                objectFit: "cover"
                              }}
                            />
                          ) : <Music size={22} />}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <b>{song.title}</b>

                            <small style={{
                              display: "block",
                              color: "#aaa"
                            }}>
                              {song.artist}
                            </small>
                          </div>
                        </div>
                      ))}

                      {selectedPlaylistSongs.length === 0 && (
                        <p style={{ color: "#aaa" }}>
                          Bu playlistda hali musiqa yo'q.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3>Playlistlar ({playlistCount})</h3>

                    <div style={card}>
                      {playlists.map(playlist => {
                        const owner = userMap[playlist.user_id];

                        const count = playlistRelations.filter(
                          r => r.playlist_id === playlist.id
                        ).length;

                        return (
                          <button
                            key={playlist.id}
                            onClick={() => openPlaylist(playlist)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                              padding: "13px 0",
                              background: "transparent",
                              color: "white",
                              border: 0,
                              borderBottom: "1px solid #302a40",
                              textAlign: "left",
                              cursor: "pointer"
                            }}
                          >
                            <div style={{
                              width: 44,
                              height: 44,
                              borderRadius: 10,
                              background: "#302344",
                              display: "grid",
                              placeItems: "center",
                              overflow: "hidden",
                              flexShrink: 0
                            }}>
                              {playlist.cover_url ? (
                                <img
                                  src={playlist.cover_url}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover"
                                  }}
                                />
                              ) : <ListMusic />}
                            </div>

                            <div style={{
                              flex: 1,
                              minWidth: 0
                            }}>
                              <b>{playlist.name}</b>

                              <small style={{
                                display: "block",
                                color: "#aaa",
                                marginTop: 4
                              }}>
                                {owner?.display_name || "Noma'lum egasi"}
                              </small>

                              <small style={{ color: "#a78bfa" }}>
                                {count} ta musiqa
                              </small>
                            </div>

                            <ChevronRight size={19} />
                          </button>
                        );
                      })}

                      {playlists.length === 0 && (
                        <p style={{ color: "#aaa" }}>
                          Hozircha playlist yo'q.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* SONGS */}

            {activeSection === "songs" && (
              <>
                <form onSubmit={uploadSingle} style={card}>
                  <h3>
                    <Music size={18} /> Bittalab musiqa qo'shish
                  </h3>

                  <label>Musiqa fayli</label>
                  <input
                    style={input}
                    type="file"
                    accept="audio/*"
                    onChange={e =>
                      setSingleAudio(e.target.files?.[0] || null)
                    }
                    required
                  />

                  {singleAudio && (
                    <p style={{
                      color: "#a78bfa",
                      fontSize: 13
                    }}>
                      Tanlandi: {singleAudio.name}
                    </p>
                  )}

                  <label>Musiqa nomi</label>
                  <input
                    style={input}
                    placeholder="Masalan: Asylum"
                    value={singleTitle}
                    onChange={e => setSingleTitle(e.target.value)}
                    required
                  />

                  <label>Ijrochi</label>
                  <input
                    style={input}
                    placeholder="Masalan: PRINCE"
                    value={singleArtist}
                    onChange={e => setSingleArtist(e.target.value)}
                    required
                  />

                  <label>Janr</label>
                  <select
                    style={input}
                    value={singleGenre}
                    onChange={e => setSingleGenre(e.target.value)}
                  >
                    <option>Boshqa</option>
                    <option>Pop</option>
                    <option>Rap</option>
                    <option>Rock</option>
                    <option>Uzbek</option>
                    <option>Ruskiy</option>
                  </select>

                  <label>Muqova rasmi (ixtiyoriy)</label>
                  <input
                    style={input}
                    type="file"
                    accept="image/*"
                    onChange={e =>
                      setSingleCover(e.target.files?.[0] || null)
                    }
                  />

                  <button
                    style={button}
                    disabled={singleUploading}
                  >
                    {singleUploading
                      ? "Yuklanmoqda..."
                      : "Bitta musiqani qo'shish"}
                  </button>
                </form>

                <form onSubmit={uploadMany} style={card}>
                  <h3>
                    <Upload size={18} /> Bir nechta musiqa yuklash
                  </h3>

                  <label>Musiqalarni tanlang</label>
                  <input
                    style={input}
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={e =>
                      setAudioFiles(Array.from(e.target.files || []))
                    }
                  />

                  {audioFiles.length > 0 && (
                    <p style={{
                      color: "#a78bfa",
                      fontSize: 13
                    }}>
                      {audioFiles.length} ta musiqa tanlandi
                    </p>
                  )}

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
                    onChange={e =>
                      setCoverFile(e.target.files?.[0] || null)
                    }
                  />

                  {uploading && (
                    <p style={{ color: "#a78bfa" }}>
                      Yuklanmoqda: {progress}%
                    </p>
                  )}

                  <button
                    style={button}
                    disabled={uploading}
                  >
                    {uploading
                      ? "Yuklanmoqda..."
                      : "Musiqalarni yuklash"}
                  </button>
                </form>

                <div style={card}>
                  <h3>
                    Barcha musiqalar ({publishedSongs.length})
                  </h3>

                  {publishedSongs.map(song =>
                    renderSong(song, false)
                  )}

                  {publishedSongs.length === 0 && (
                    <p style={{ color: "#aaa" }}>
                      Hozircha musiqa yo'q.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* REFRESH */}

            <button
              onClick={loadData}
              disabled={loading}
              style={{
                ...button,
                background: "#302344",
                marginTop: 4
              }}
            >
              <RefreshCw
                size={16}
                style={{
                  verticalAlign: "middle",
                  marginRight: 7
                }}
              />

              {loading
                ? "Yangilanmoqda..."
                : "Statistikani yangilash"}
            </button>
          </>
        )}

        {message && (
          <p style={{
            background: "#173d2c",
            color: "#75e6a5",
            padding: 12,
            borderRadius: 10,
            overflowWrap: "anywhere"
          }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{
            background: "#451f2a",
            color: "#ff9292",
            padding: 12,
            borderRadius: 10,
            overflowWrap: "anywhere"
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
