
import React, { useEffect, useRef, useState } from "react";
import {
  Home, Search, Library, Play, Pause,
  SkipBack, SkipForward, Music2, Headphones,
  Lock, Plus, ArrowLeft, Trash2, X,
  ListMusic, ImagePlus
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

  useEffect(() => {
    async function setupUser() {
      const { data } = await supabase.auth.getSession();
      let user = data.session?.user;

      if (!user) {
        const { data: result, error } =
          await supabase.auth.signInAnonymously();

        if (error) {
          alert("Kirish xatosi: " + error.message);
          return;
        }
        user = result.user;
      }

      if (user) setUserId(user.id);
    }
    setupUser();
  }, []);

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

  useEffect(() => {
    if (userId) loadPlaylists();
  }, [userId]);

  async function loadPlaylists() {
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }

    const list = data || [];
    const { data: relations } = await supabase
      .from("playlist_songs")
      .select("playlist_id, song_id");

    const counts = {};
    (relations || []).forEach(item => {
      counts[item.playlist_id] =
        (counts[item.playlist_id] || 0) + 1;
    });

    setPlaylists(list.map(p => ({
      ...p,
      songCount: counts[p.id] || 0
    })));
  }

  async function createPlaylist() {
    const name = newPlaylistName.trim();

    if (!name) {
      alert("Playlist nomini yozing!");
      return;
    }

    const { error } = await supabase
      .from("playlists")
      .insert({ name, user_id: userId });

    if (error) {
      alert("Xatolik: " + error.message);
      return;
    }

    setNewPlaylistName("");
    setShowCreate(false);
    loadPlaylists();
  }

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

    const ids = (data || []).map(item => item.song_id);
    setPlaylistSongs(songs.filter(song => ids.includes(song.id)));
  }

  async function addSongToPlaylist() {
    if (!selectedSongId || !selectedPlaylist) {
      alert("Qo‘shiq tanlang!");
      return;
    }

    const { error } = await supabase
      .from("playlist_songs")
      .insert({
        playlist_id: selectedPlaylist.id,
        song_id: selectedSongId
      });

    if (error) {
      alert(error.code === "23505"
        ? "Bu qo‘shiq playlistda bor!"
        : "Xatolik: " + error.message);
      return;
    }

    setShowAddSong(false);
    setSelectedSongId("");
    await openPlaylist(selectedPlaylist);
    await loadPlaylists();
  }

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

  async function uploadPlaylistCover(file) {
    if (!file || !selectedPlaylist || !userId) return;

    if (!file.type.startsWith("image/")) {
      alert("Faqat rasm tanlang!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Rasm hajmi 5 MB dan oshmasin!");
      return;
    }

    const extension = file.name.split(".").pop().toLowerCase();
    const filePath =
      `${userId}/covers/${Date.now()}-${Math.random()
        .toString(36).slice(2)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("music")
      .upload(filePath, file);

    if (uploadError) {
      alert("Rasm yuklashda xatolik: " + uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("music")
      .getPublicUrl(filePath);

    const { error } = await supabase
      .from("playlists")
      .update({ cover_url: data.publicUrl })
      .eq("id", selectedPlaylist.id);

    if (error) {
      alert("Xatolik: " + error.message);
      return;
    }

    setSelectedPlaylist({
      ...selectedPlaylist,
      cover_url: data.publicUrl
    });

    await loadPlaylists();
    alert("Playlist muqovasi yangilandi! 💜");
  }

  async function deletePlaylist(playlist) {
    if (!window.confirm(
      `"${playlist.name}" playlistini o‘chirmoqchimisiz?`
    )) return;

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

  function playSong(song) {
    if (!song?.audio_url) {
      alert("Audio fayl topilmadi.");
      return;
    }

    if (currentSong?.id === song.id && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => setPlaying(false));
      }
      return;
    }

    setCurrentSong(song);
    setPlaying(true);

    if (audioRef.current) {
      audioRef.current.src = song.audio_url;
      audioRef.current.play().catch(() => setPlaying(false));
    }
  }

  function nextSong() {
    if (!songs.length || !currentSong) return;
    const index = songs.findIndex(s => s.id === currentSong.id);
    playSong(songs[(index + 1) % songs.length]);
  }

  function previousSong() {
    if (!songs.length || !currentSong) return;
    const index = songs.findIndex(s => s.id === currentSong.id);
    playSong(songs[(index - 1 + songs.length) % songs.length]);
  }

  const filteredSongs = songs.filter(song =>
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
          <div className="logo"><Headphones size={23} /></div>
          <b>Espo<span className="purple">fiy</span></b>
        </div>
        <button className="profile" onClick={() => setShowAdmin(true)}>
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
              {songs.map(song => (
                <div className="song" key={song.id}>
                  <div className="cover">
                    {song.cover_url
                      ? <img src={song.cover_url} alt="" />
                      : <Music2 />}
                  </div>
                  <div className="song-info">
                    <b>{song.title}</b>
                    <span>{song.artist}</span>
                  </div>
                  <button className="play-small"
                    onClick={() => playSong(song)}>
                    {currentSong?.id === song.id && playing
                      ? <Pause size={18} />
                      : <Play size={18} fill="white" />}
                  </button>
                </div>
              ))}
              {songs.length === 0 &&
                <p className="small">Hozircha qo‘shiqlar yo‘q.</p>}
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
              onChange={e => setSearch(e.target.value)}
            />

            <div className="songs">
              {filteredSongs.map(song => (
                <div className="song" key={song.id}>
                  <div className="cover">
                    {song.cover_url
                      ? <img src={song.cover_url} alt="" />
                      : <Music2 />}
                  </div>
                  <div className="song-info">
                    <b>{song.title}</b>
                    <span>{song.artist}</span>
                  </div>
                  <button className="play-small"
                    onClick={() => playSong(song)}>
                    <Play size={18} fill="white" />
                  </button>
                </div>
              ))}
              {filteredSongs.length === 0 &&
                <p className="small">Hech narsa topilmadi.</p>}
            </div>
          </>
        )}

        {tab === "library" && (
          <>
            {selectedPlaylist ? (
              <>
                <div style={headerStyle}>
                  <button onClick={() => setSelectedPlaylist(null)}
                    style={iconButton}>
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
                  <button onClick={() => setShowAddSong(true)}
                    style={iconButton}>
                    <Plus />
                  </button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={coverPreviewStyle}>
                    {selectedPlaylist.cover_url
                      ? <img
                          src={selectedPlaylist.cover_url}
                          alt="Playlist muqovasi"
                          style={coverImageStyle}
                        />
                      : <ListMusic size={55} />}
                  </div>

                  <label style={coverButtonStyle}>
                    <ImagePlus size={20} />
                    Muqova rasmini tanlash
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={e => {
                        uploadPlaylistCover(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                <div className="songs">
                  {playlistSongs.map(song => (
                    <div className="song" key={song.id}>
                      <div className="cover">
                        {song.cover_url
                          ? <img src={song.cover_url} alt="" />
                          : <Music2 />}
                      </div>
                      <div className="song-info"
                        onClick={() => playSong(song)}>
                        <b>{song.title}</b>
                        <span>{song.artist}</span>
                      </div>
                      <button className="play-small"
                        onClick={() => removeSongFromPlaylist(song.id)}>
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  {playlistSongs.length === 0 &&
                    <p className="small">
                      Playlist bo‘sh. + tugmasi orqali qo‘shiq qo‘shing.
                    </p>}
                </div>

                {showAddSong && (
                  <div style={modalStyle}>
                    <div style={modalCardStyle}>
                      <div style={modalHeaderStyle}>
                        <b>Qo‘shiq qo‘shish</b>
                        <button onClick={() => setShowAddSong(false)}
                          style={iconButton}><X /></button>
                      </div>
                      <select
                        value={selectedSongId}
                        onChange={e => setSelectedSongId(e.target.value)}
                        style={inputStyle}>
                        <option value="">Qo‘shiqni tanlang</option>
                        {songs.map(song => (
                          <option key={song.id} value={song.id}>
                            {song.title} — {song.artist}
                          </option>
                        ))}
                      </select>
                      <button onClick={addSongToPlaylist}
                        style={mainButtonStyle}>
                        Playlistga qo‘shish
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={headerStyle}>
                  <h2 className="section-title">Mening playlistlarim</h2>
                  <button onClick={() => setShowCreate(true)}
                    style={iconButton}><Plus /></button>
                </div>

                <div className="songs">
                  {playlists.map(playlist => (
                    <div className="song" key={playlist.id}
                      onClick={() => openPlaylist(playlist)}
                      style={{ cursor: "pointer" }}>
                      <div className="cover">
                        {playlist.cover_url
                          ? <img src={playlist.cover_url} alt="" />
                          : <ListMusic />}
                      </div>
                      <div className="song-info">
                        <b>{playlist.name}</b>
                        <span>{playlist.songCount} ta qo‘shiq</span>
                      </div>
                      <button className="play-small"
                        onClick={e => {
                          e.stopPropagation();
                          deletePlaylist(playlist);
                        }}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}

                  {playlists.length === 0 && (
                    <div className="library-card">
                      <Music2 size={35} />
                      <h3>Hali playlist yo‘q</h3>
                      <p>Birinchi playlistingizni yarating!</p>
                      <button onClick={() => setShowCreate(true)}
                        style={mainButtonStyle}>
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
                    <button onClick={() => setShowCreate(false)}
                      style={iconButton}><X /></button>
                  </div>
                  <input
                    value={newPlaylistName}
                    onChange={e => setNewPlaylistName(e.target.value)}
                    placeholder="Playlist nomini yozing..."
                    style={inputStyle}
                  />
                  <button onClick={createPlaylist}
                    style={mainButtonStyle}>
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
              {currentSong.cover_url
                ? <img src={currentSong.cover_url} alt="" />
                : <Music2 />}
            </div>
            <div>
              <b>{currentSong.title}</b>
              <span>{currentSong.artist}</span>
            </div>
          </div>
          <div className="controls">
            <button onClick={previousSong}><SkipBack size={19} /></button>
            <button onClick={() => playSong(currentSong)}>
              {playing ? <Pause size={22} /> : <Play size={22} fill="white" />}
            </button>
            <button onClick={nextSong}><SkipForward size={19} /></button>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <button onClick={() => {
          setTab("home");
          setSelectedPlaylist(null);
        }} className={tab === "home" ? "active" : ""}>
          <Home /><span>Bosh sahifa</span>
        </button>
        <button onClick={() => {
          setTab("search");
          setSelectedPlaylist(null);
        }} className={tab === "search" ? "active" : ""}>
          <Search /><span>Qidiruv</span>
        </button>
        <button onClick={() => {
          setTab("library");
          setSelectedPlaylist(null);
        }} className={tab === "library" ? "active" : ""}>
          <Library /><span>Kutubxona</span>
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
  justifyContent: "center"
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 20
};

const modalStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20
};

const modalCardStyle = {
  width: "100%",
  maxWidth: 380,
  background: "#171321",
  borderRadius: 18,
  padding: 20,
  color: "white"
};

const modalHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 18
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
  fontSize: 15
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
  cursor: "pointer"
};

const coverPreviewStyle = {
  width: 150,
  height: 150,
  margin: "0 auto 14px",
  borderRadius: 20,
  background: "#292039",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  color: "#b99aff"
};

const coverImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover"
};

const coverButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: 13,
  borderRadius: 12,
  background: "#8b5cf6",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer"
};
