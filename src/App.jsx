
import React, { useState } from "react";
import {
  Home, Search, Heart, Library, Play, Pause,
  SkipBack, SkipForward, Music2, Plus, Headphones
} from "lucide-react";
import "./style.css";

export default function App() {
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState("home");

  const songs = [
    { title: "Night Drive", artist: "Espofiy", color: "#7135b8" },
    { title: "Purple Sky", artist: "Unknown", color: "#412080" },
    { title: "Dreams", artist: "Music World", color: "#9b42ad" },
    { title: "Moonlight", artist: "Espofiy", color: "#542b91" }
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo"><Headphones /></div>
          <span>Espo<span className="purple">fiy</span></span>
        </div>
        <div className="profile">E</div>
      </header>

      <main>
        <div className="welcome">
          <span className="small">PREMIUM MUSIC EXPERIENCE</span>
          <h1>Musiqa bilan<br /><span>yasha.</span></h1>
          <p>Sevimli musiqalaringni kashf et.</p>
        </div>

        <div className="section-title">
          <h2>Yangi musiqalar</h2>
          <span>Hammasi</span>
        </div>

        <div className="songs">
          {songs.map((song, i) => (
            <div className="song" key={i}>
              <div className="cover" style={{background: song.color}}>
                <Music2 size={30}/>
              </div>
              <div className="song-info">
                <b>{song.title}</b>
                <span>{song.artist}</span>
              </div>
              <button className="play-small" onClick={() => setPlaying(!playing)}>
                <Play size={18} fill="white"/>
              </button>
            </div>
          ))}
        </div>

        <div className="section-title">
          <h2>Sening kutubxonang</h2>
        </div>
        <div className="library-card">
          <Heart size={25}/>
          <div>
            <b>Sevimlilar</b>
            <span>Sevimli musiqalaring shu yerda</span>
          </div>
        </div>
      </main>

      <div className="player">
        <div className="player-song">
          <div className="mini-cover"><Music2/></div>
          <div><b>Espofiy Music</b><span>Hozircha musiqa tanlanmagan</span></div>
        </div>
        <div className="controls">
          <SkipBack size={20}/>
          <button onClick={() => setPlaying(!playing)}>
            {playing ? <Pause fill="white"/> : <Play fill="white"/>}
          </button>
          <SkipForward size={20}/>
        </div>
        <div className="progress"><div/></div>
      </div>

      <nav className="bottom-nav">
        <button onClick={() => setTab("home")} className={tab === "home" ? "active" : ""}>
          <Home/><span>Bosh sahifa</span>
        </button>
        <button onClick={() => setTab("search")} className={tab === "search" ? "active" : ""}>
          <Search/><span>Qidiruv</span>
        </button>
        <button onClick={() => setTab("library")} className={tab === "library" ? "active" : ""}>
          <Library/><span>Kutubxona</span>
        </button>
      </nav>
    </div>
  );
}
