import React, { useEffect, useRef, useState } from "react";
import {
  Home,
  Search,
  Library,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  Headphones,
  Lock,
  Plus,
  ArrowLeft,
  Trash2,
  X,
  ListMusic,
} from "lucide-react";

import { supabase } from "./supabase";
import Admin from "./Admin";
import "./style.css";

export default function App() {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistSongs, setPlaylistSongs] = useState([]);

  const [userId, setUserId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showAddSong, setShowAddSong] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState("");

  const audioRef = useRef(null);

  // Foydalanuvchini aniqlash
  useEffect(() => {
    async function setupUser() {
      const { data } = await supabase.auth.getSession();

      let user = data.session?.user;

      if (!user) {
        const { data: anonymousData, error } =
          await supabase.auth.signInAnonymously();

        if (error) {
          console.error("Kirish xatosi:", error.message);
          return;
        }

        user = anonymousData.user;
      }

      if (user) {
        setUserId(user.id);
      }
    }

    setupUser();
  }, []);

  // Qo‘shiqlarni yuklash
  useEffect(() => {
    loadSongs();
  }, []);

  async function loadSongs() {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }

    setSongs(data || []);
  }

  // Playlistlarni yuklash
  useEffect(() => {
    if (userId) {
      loadPlaylists();
    }
  }, [userId]);

  async function loadPlaylists() {
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Playlist xatosi:", error.message);
      return;
    }

    const list = data || [];

    const { data: relations } = await supabase
      .from("playlist_songs")
      .select("playlist_id, song_id");

    const counts = {};

    (relations || []).forEach((item) => {
      counts[item.playlist_id] = (counts[item.playlist_id] || 0) + 1;
    });

    setPlaylists(
      list.map((playlist) => ({
        ...playlist,
        songCount: counts[playlist.id] || 0,
      }))
    );
  }

  // Playlist yaratish
  async function createPlaylist() {
    const name = newPlaylistName.trim();

    if (!name) {
      alert("Playlist nomini yozing!");
      return;
    }

    if (!userId) {
      alert("Hisob tayyor bo‘lmadi. Qayta urinib ko‘ring.");
      return;
    }

    const { error } = await supabase.from("playlists").insert({
      name,
      user_id: userId,
    });

    if (error) {
      alert("Xatolik: " + error.message);
      return;
    }

    setNewPlaylistName("");
    setShowCreate(false);
    await loadPlaylists();
  }

  // Playlist ichini ochish
  async function openPlaylist(playlist) {
    setSelectedPlaylist(playlist);

    const { data, error } = await supabase
      .from("playlist_songs")
      .select("song_id")
      .eq("playlist_id", playlist.id);

    if (error) {
      alert("Xatolik: " + error.message);
      return;
    }

    const ids = (data || []).map((item) => item.song_id);
    setPlaylistSongs(songs.filter((song) => ids.includes(song.id)));
  }

  // Playlistga qo‘shiq qo‘shish
  async function addSongToPlaylist() {
    if (!selectedSongId || !selectedPlaylist) {
      alert("Avval qo‘shiq tanlang!");
      return;
    }

    const { error } = await supabase.from("playlist_songs").insert({
      playlist_id: selectedPlaylist.id,
      song_id: selectedSongId,
    });

    if (error) {
      alert(
        error.code === "23505"
          ? "Bu qo‘shiq playlistda bor!"
          : "Xatolik: " + error.message
      );
      return;
    }

    setShowAddSong(false);
    setSelectedSongId("");

    await openPlaylist(selectedPlaylist);
    await loadPlaylists();
  }

  // Playlistdan qo‘shiqni olib tashlash
  async function removeSongFromPlaylist(songId) {
    const { error } = await supabase
      .from("playlist_songs")
      .delete()
      .eq("playlist_id", selectedPlaylist.id)
      .eq("song_id", songId);

    if (error) {
      alert("Xatolik: " + error.message);
      return;
    }

    await openPlaylist(selectedPlaylist);
    await loadPlaylists();
  }

  // Playlistni o‘chirish
  async function deletePlaylist(playlist) {
    const yes = window.confirm(
      `"${playlist.name}" playlistini o‘chirmoqchimisiz?`
    );

    if (!yes) return;

    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", playlist.id);

    if (error) {
      alert("Xatolik: " + error.message);
      return;
    }

    setSelectedPlaylist(null);
    await loadPlaylists();
  }

  // Musiqa ijro etish
  function playSong(song) {
    if (!song?.audio_url) {
      alert("Bu qo‘shiqning audio fayli topilmadi.");
      return;
    }

    if (currentSong?.id === song.id && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
      return;
    }

    setCurrentSong(song);
    setPlaying(true);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = song.audio_url;
        audioRef.current.play().catch(() => setPlaying(false));
      }
    }, 100);
  }

  function nextSong() {
    if (!songs.length || !currentSong) return;

    const index = songs.findIndex((song) => song.id === currentSong.id);
    const next = songs[(index + 1) % songs.length];

    playSong(next);
  }

  function previousSong() {
    if (!songs.length || !currentSong) return;

    const index = songs.findIndex((song) => song.id === currentSong.id);
    const previous =
      songs[(index - 1 + songs.length) % songs.length];

    playSong(previous);
  }

  const filteredSongs = songs.filter((song) =>
    `${song.title} ${song.artist}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (showAdmin) {
    return <Admin onClose={() => setShowAdmin(false)} />;
  }

  return (
    <div className="app">
      <audio
        ref={audioRef}
        onEnded={nextSong}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <header className="header">
        <div className="brand">
          <div className="logo">
            <Headphones size={23} />
          </div>
          <b>Espo<span className="purple">fiy</span></b>
        </div>

        <button
          className="profile"
          onClick={() => setShowAdmin(true)}
          aria-label="Admin"
        >
          <Lock size={19} />
        </button>
      </header>

      <main>
        {tab === "home" && (
          <>
            <section className="welcome">
              <p className="small">MUSIQA OLAMIGA XUSH KELIBSIZ</p>
              <h1>Salom! 👋</h1>
              <p>Sevimli musiqalaringizni tinglang.</p>
            </section>

            <h2 className="section-title">Yangi qo‘shiqlar</h2>

            <div className="songs">
              {songs.map((song) => (
                <div className="song" key={song.id}>
                  <div className="cover">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" />
                    ) : (
                      <Music2 />
                    )}
                  </div>

                  <div className="song-info">
                    <b>{song.title}</b>
                    <span>{song.artist}</span>
                  </div>

                  <button
                    className="play-small"
                    onClick={() => playSong(song)}
                  >
                    {currentSong?.id === song.id && playing ? (
                      <Pause size={18} />
                    ) : (
                      <Play size={18} fill="white" />
                    )}
                  </button>
                </div>
              ))}

              {songs.length === 0 && (
                <p className="small">Hozircha qo‘shiqlar yo‘q.</p>
              )}
            </div>
          </>
        )}

        {tab === "search" && (
          <>
            <h2 className="section-title">Qidiruv</h2>

            <input
              className="search-input"
              placeholder="Qo‘shiq yoki ijrochi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="songs">
              {filteredSongs.map((song) => (
                <div className="song" key={song.id}>
                  <div className="cover">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" />
                    ) : (
                      <Music2 />
                    )}
                  </div>

                  <div className="song-info">
                    <b>{song.title}</b>
                    <span>{song.artist}</span>
                  </div>

                  <button
                    className="play-small"
                    onClick={() => playSong(song)}
                  >
                    <Play size={18} fill="white" />
                  </button>
                </div>
              ))}

              {filteredSongs.length === 0 && (
                <p className="small">Hech narsa topilmadi.</p>
              )}
            </div>
          </>
        )}

        {tab === "library" && (
          <>
            {selectedPlaylist ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 22,
                  }}
                >
                  <button
                    onClick={() => setSelectedPlaylist(null)}
                    style={iconButton}
                  >
                    <ArrowLeft />
                  </button>

                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0 }}>
                      {selectedPlaylist.name}
                    </h2>
                    <p className="small">
                      {playlistSongs.length} ta qo‘shiq
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddSong(true)}
                    style={iconButton}
                  >
                    <Plus />
                  </button>
                </div>

                <div className="songs">
                  {playlistSongs.map((song) => (
                    <div className="song" key={song.id}>
                      <div className="cover">
                        {song.cover_url ? (
                          <img src={song.cover_url} alt="" />
                        ) : (
                          <Music2 />
                        )}
                      </div>

                      <div
                        className="song-info"
                        onClick={() => playSong(song)}
                      >
                        <b>{song.title}</b>
                        <span>{song.artist}</span>
                      </div>

                      <button
                        className="play-small"
                        onClick={() => removeSongFromPlaylist(song.id)}
                        title="O‘chirish"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}

                  {playlistSongs.length === 0 && (
                    <p className="small">
                      Playlist hozircha bo‘sh. + tugmasini bosib qo‘shiq qo‘shing.
                    </p>
                  )}
                </div>

                {showAddSong && (
                  <div style={modalStyle}>
                    <div style={modalCardStyle}>
                      <div style={modalHeaderStyle}>
                        <b>Qo‘shiq qo‘shish</b>
                        <button
                          onClick={() => setShowAddSong(false)}
                          style={iconButton}
                        >
                          <X />
                        </button>
                      </div>

                      <select
                        value={selectedSongId}
                        onChange={(e) => setSelectedSongId(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Qo‘shiqni tanlang</option>
                        {songs.map((song) => (
                          <option key={song.id} value={song.id}>
                            {song.title} — {song.artist}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={addSongToPlaylist}
                        style={mainButtonStyle}
                      >
                        Playlistga qo‘shish
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={modalHeaderStyle}>
                  <h2 className="section-title">Mening playlistlarim</h2>

                  <button
                    onClick={() => setShowCreate(true)}
                    style={iconButton}
                  >
                    <Plus />
                  </button>
                </div>

                <div className="songs">
                  {playlists.map((playlist) => (
                    <div
                      className="song"
                      key={playlist.id}
                      onClick={() => openPlaylist(playlist)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="cover">
                        <ListMusic />
                      </div>

                      <div className="song-info">
                        <b>{playlist.name}</b>
                        <span>{playlist.songCount} ta qo‘shiq</span>
                      </div>

                      <button
                        className="play-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlaylist(playlist);
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}

                  {playlists.length === 0 && (
                    <div className="library-card">
                      <Music2 size={35} />
                      <h3>Hali playlist yo‘q</h3>
                      <p>Birinchi playlistingizni yarating!</p>
                      <button
                        onClick={() => setShowCreate(true)}
                        style={mainButtonStyle}
                      >
                        <Plus size={18} /> Playlist yaratish
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {showCreate && (
              <div style={modalStyle}>
                <div style={modalCardStyle}>
                  <div style={modalHeaderStyle}>
                    <b>Yangi playlist</b>
                    <button
                      onClick={() => setShowCreate(false)}
                      style={iconButton}
                    >
                      <X />
                    </button>
                  </div>

                  <input
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Playlist nomini yozing..."
                    style={inputStyle}
                  />

                  <button
                    onClick={createPlaylist}
                    style={mainButtonStyle}
                  >
                    <Plus size={18} /> Yaratish
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {currentSong && (
        <div className="player">
          <div className="player-song">
            <div className="mini-cover">
              {currentSong.cover_url ? (
                <img src={currentSong.cover_url} alt="" />
              ) : (
                <Music2 />
              )}
            </div>

            <div>
              <b>{currentSong.title}</b>
              <span>{currentSong.artist}</span>
            </div>
          </div>

          <div className="controls">
            <button onClick={previousSong}>
              <SkipBack size={19} />
            </button>

            <button onClick={() => playSong(currentSong)}>
              {playing ? (
                <Pause size={22} />
              ) : (
                <Play size={22} fill="white" />
              )}
            </button>

            <button onClick={nextSong}>
              <SkipForward size={19} />
            </button>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <button
          onClick={() => {
            setTab("home");
            setSelectedPlaylist(null);
          }}
          className={tab === "home" ? "active" : ""}
        >
          <Home />
          <span>Bosh sahifa</span>
        </button>

        <button
          onClick={() => {
            setTab("search");
            setSelectedPlaylist(null);
          }}
          className={tab === "search" ? "active" : ""}
        >
          <Search />
          <span>Qidiruv</span>
        </button>

        <button
          onClick={() => {
            setTab("library");
            setSelectedPlaylist(null);
          }}
          className={tab === "library" ? "active" : ""}
        >
          <Library />
          <span>Kutubxona</span>
        </button>
      </nav>
    </div>
  );
}

const iconButton = {
  background: "#252033",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalCardStyle = {
  width: "100%",
  maxWidth: 380,
  background: "#171321",
  borderRadius: 18,
  padding: 20,
  color: "white",
};

const modalHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 18,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 14,
  borderRadius: 10,
  border: "1px solid #40364f",
  background: "#252033",
  color: "white",
  marginBottom: 14,
  fontSize: 15,
};

const mainButtonStyle = {
  width: "100%",
  padding: 14,
  border: "none",
  borderRadius: 12,
  background: "#8b5cf6",
  color: "white",
  fontWeight: "bold",
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
};
