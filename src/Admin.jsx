
import React, { useEffect, useState } from "react";
import {
  ArrowLeft, Music, Trash2, Upload, LogOut,
  RefreshCw, Headphones, ListMusic,
  ChevronRight, TrendingUp, Play, Check, X,
  Pencil, Save, Activity
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
      playlistsResult,
      relationsResult,
      songCountResult,
      playlistCountResult
    ] = await Promise.all([
      supabase.from("songs")
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
              Yuborgan foydalanuvchi ID
            </small>

            <p style={{
              margin: "5px 0",
              fontSize: 12,
              wordBreak: "break-all"
            }}>
              {song.submitted_by || "Noma'lum"}
            </p>

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

                  <div style={card}>
                    <Activity color="#a78bfa" />
                    <h2>{pendingSongs.length}</h2>
                    <small>Tekshiruvdagi musiqalar</small>
                  </div>
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
                        Playlist egasining ID raqami:
                      </p>

                      <b style={{ wordBreak: "break-all" }}>
                        {selectedPlaylist.user_id || "Mavjud emas"}
                      </b>

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
                                color: "#a78bfa",
                                marginTop: 4
                              }}>
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
