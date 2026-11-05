import React, { useEffect, useState } from "react";
import {
  Home, Search, Heart, Library, Play, Pause,
  SkipBack, SkipForward, Music2, Headphones, Lock
} from "lucide-react";
import { supabase } from "./supabase";
import Admin from "./Admin";
import "./style.css";

export default function App() {
  const [songs, setSongs] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [audio] = useState(() => new Audio());

  useEffect(() => {
    loadSongs();
    return () => audio.pause();
  }, []);

  async function loadSongs() {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!error) setSongs(data || []);
  }

  function playSong(song) {
    if (currentSong?.id === song.id) {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        audio.play();
        setPlaying(true);
      }
      return;
    }

    audio.src = song.audio_url;
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));

    setCurrentSong(song);
  }

  function nextSong() {
    if (!songs.length) return;
    const index = songs.findIndex(s => s.id === currentSong?.id);
    playSong(songs[(index + 1) % songs.length]);
  }

  function previousSong() {
    if (!songs.length) return;
    const index = songs.findIndex(s => s.id === currentSong?.id);
    playSong(songs[(index - 1 + songs.length) % songs.length]);
  }

  const visibleSongs = songs.filter(song =>
    `${song.title} ${song.artist}`.toLowerCase().includes(search.toLowerCase())
  );

  if (showAdmin) {
    return (
      <div>
        <button
          onClick={() => setShowAdmin(false)}
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            zIndex: 50,
            background: "#933ee0",
            color: "white",
            padding: 10,
            borderRadius: 10
          }}
        >
          Orqaga
        </button>
        <Admin />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo"><Headphones /></div>
          <span>Espo<span className="purple">fiy</span></span>
        </div>
        <button className="profile" onClick={() => setShowAdmin(true)}>
          <Lock size={17} />
        </button>
      </header>

      {tab === "home" && (
        <main>
          <div className="welcome">
            <span className="small">PREMIUM MUSIC EXPERIENCE</span>
            <h1>Musiqa bilan<br /><span>yasha.</span></h1>
            <p>Sevimli musiqalaringni kashf et.</p>
          </div>

          <div className="section-title">
            <h2>Yangi musiqalar</h2>
            <span>{songs.length} ta musiqa</span>
          </div>

          <div className="songs">
            {visibleSongs.length === 0 ? (
              <p style={{ color: "#aaa", padding: 15 }}>
                Hozircha musiqa yo‘q. Tez orada qo‘shiladi.
              </p>
            ) : visibleSongs.map(song => (
              <div className="song" key={song.id}>
                <div className="cover">
                  {song.cover_url
                    ? <img src={song.cover_url} alt="" style={{
                        width: "100%", height: "100%",
                        objectFit: "cover", borderRadius: 12
                      }} />
                    : <Music2 size={30} />}
                </div>
                <div className="song-info">
                  <b>{song.title}</b>
                  <span>{song.artist}</span>
                </div>
                <button className="play-small" onClick={() => playSong(song)}>
                  {currentSong?.id === song.id && playing
                    ? <Pause size={18} fill="white" />
                    : <Play size={18} fill="white" />}
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {tab === "search" && (
        <main>
          <h2 style={{ marginBottom: 20 }}>Qidiruv</h2>
          <input
            placeholder="Qo‘shiq yoki ijrochi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: 15, borderRadius: 12,
              background: "#171320", color: "white",
              border: "1px solid #453052", marginBottom: 20
            }}
          />
          <div className="songs">
            {visibleSongs.map(song => (
              <div className="song" key={song.id}>
                <div className="cover"><Music2 /></div>
                <div className="song-info">
                  <b>{song.title}</b>
                  <span>{song.artist}</span>
                </div>
                <button className="play-small" onClick={() => playSong(song)}>
                  <Play size={18} fill="white" />
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {tab === "library" && (
        <main>
          <h2>Mening kutubxonam</h2>
          <div className="library-card" style={{ marginTop: 20 }}>
            <Heart size={25} />
            <div>
              <b>Espofiy musiqalari</b>
              <span>{songs.length} ta qo‘shiq</span>
            </div>
          </div>
        </main>
      )}

      <div className="player">
        <div className="player-song">
          <div className="mini-cover">
            {currentSong?.cover_url
              ? <img src={currentSong.cover_url} alt="" style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  borderRadius: 9
                }} />
              : <Music2 />}
          </div>
          <div>
            <b>{currentSong?.title || "Espofiy Music"}</b>
            <span>{currentSong?.artist || "Musiqa tanlanmagan"}</span>
          </div>
        </div>
        <div className="controls">
          <button onClick={previousSong}><SkipBack size={18} /></button>
          <button onClick={() => currentSong && playSong(currentSong)}>
            {playing ? <Pause fill="white" /> : <Play fill="white" />}
          </button>
          <button onClick={nextSong}><SkipForward size={18} /></button>
        </div>
        <div className="progress"><div /></div>
      </div>

      <nav className="bottom-nav">
        <button onClick={() => setTab("home")} className={tab === "home" ? "active" : ""}>
          <Home /><span>Bosh sahifa</span>
        </button>
        <button onClick={() => setTab("search")} className={tab === "search" ? "active" : ""}>
          <Search /><span>Qidiruv</span>
        </button>
        <button onClick={() => setTab("library")} className={tab === "library" ? "active" : ""}>
          <Library /><span>Kutubxona</span>
        </button>
      </nav>
    </div>
  );
}
