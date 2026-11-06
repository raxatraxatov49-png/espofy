
import React, { useEffect, useRef, useState } from "react";
import {
  Home, Search, Library, Play, Pause,
  SkipBack, SkipForward, Music2, Headphones,
  Lock, Plus, ArrowLeft, Trash2, X,
  ListMusic, ImagePlus, Settings, Globe, Check
} from "lucide-react";

import { supabase } from "./supabase";
import Admin from "./Admin";
import "./style.css";

const translations = {
  uz: {
    settings: "Sozlamalar",
    language: "Ilova tili",
    home: "Bosh sahifa",
    search: "Qidiruv",
    library: "Kutubxona",
    welcome: "MUSIQA OLAMIGA XUSH KELIBSIZ",
    hello: "Salom! 👋",
    subtitle: "Sevimli musiqalaringizni tinglang.",
    newSongs: "Yangi qo‘shiqlar",
    noSongs: "Hozircha qo‘shiqlar yo‘q.",
    searchTitle: "Qidiruv",
    searchPlaceholder: "Qo‘shiq yoki ijrochi...",
    notFound: "Hech narsa topilmadi.",
    myPlaylists: "Mening playlistlarim",
    songs: "ta qo‘shiq",
    chooseCover: "Muqova rasmini tanlash",
    emptyPlaylist: "Playlist bo‘sh. + tugmasi orqali qo‘shiq qo‘shing.",
    addSong: "Qo‘shiq qo‘shish",
    chooseSong: "Qo‘shiqni tanlang",
    addToPlaylist: "Playlistga qo‘shish",
    noPlaylist: "Hali playlist yo‘q",
    createFirst: "Birinchi playlistingizni yarating!",
    createPlaylist: "Playlist yaratish",
    newPlaylist: "Yangi playlist",
    playlistPlaceholder: "Playlist nomini yozing...",
    create: "Yaratish",
    cancel: "Bekor qilish",
    selectSong: "Qo‘shiq tanlang!",
    duplicate: "Bu qo‘shiq playlistda bor!",
    playlistName: "Playlist nomini yozing!",
    imageOnly: "Faqat rasm tanlang!",
    imageSize: "Rasm hajmi 5 MB dan oshmasin!",
    uploadError: "Rasm yuklashda xatolik: ",
    updated: "Playlist muqovasi yangilandi! 💜",
    audioMissing: "Audio fayl topilmadi.",
    loginError: "Kirish xatosi: ",
    error: "Xatolik: ",
    deleteConfirm: "playlistini o‘chirmoqchimisiz?",
    delete: "O‘chirish",
    languageSaved: "Til saqlandi"
  },
  ru: {
    settings: "Настройки",
    language: "Язык приложения",
    home: "Главная",
    search: "Поиск",
    library: "Библиотека",
    welcome: "ДОБРО ПОЖАЛОВАТЬ В МИР МУЗЫКИ",
    hello: "Привет! 👋",
    subtitle: "Слушайте любимую музыку.",
    newSongs: "Новые песни",
    noSongs: "Пока нет песен.",
    searchTitle: "Поиск",
    searchPlaceholder: "Песня или исполнитель...",
    notFound: "Ничего не найдено.",
    myPlaylists: "Мои плейлисты",
    songs: "песен",
    chooseCover: "Выбрать обложку",
    emptyPlaylist: "Плейлист пуст. Нажмите +, чтобы добавить песню.",
    addSong: "Добавить песню",
    chooseSong: "Выберите песню",
    addToPlaylist: "Добавить в плейлист",
    noPlaylist: "Плейлистов пока нет",
    createFirst: "Создайте свой первый плейлист!",
    createPlaylist: "Создать плейлист",
    newPlaylist: "Новый плейлист",
    playlistPlaceholder: "Введите название плейлиста...",
    create: "Создать",
    cancel: "Отмена",
    selectSong: "Выберите песню!",
    duplicate: "Эта песня уже есть в плейлисте!",
    playlistName: "Введите название плейлиста!",
    imageOnly: "Выберите изображение!",
    imageSize: "Размер изображения не должен превышать 5 МБ!",
    uploadError: "Ошибка загрузки изображения: ",
    updated: "Обложка плейлиста обновлена! 💜",
    audioMissing: "Аудиофайл не найден.",
    loginError: "Ошибка входа: ",
    error: "Ошибка: ",
    deleteConfirm: "Удалить плейлист?",
    delete: "Удалить",
    languageSaved: "Язык сохранён"
  }
};

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
  const [language, setLanguage] = useState(
    () => localStorage.getItem("espofiy-language") || "uz"
  );
  const [showSettings, setShowSettings] = useState(false);

  const audioRef = useRef(null);
  const countedPlayRef = useRef(null);

  const t = translations[language];

  function changeLanguage(lang) {
    setLanguage(lang);
    localStorage.setItem("espofiy-language", lang);
  }

  useEffect(() => {
    let cancelled = false;

    async function setupUser() {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error(sessionError.message);
        return;
      }

      let user = data.session?.user;

      if (!user) {
        const { data: result, error } =
          await supabase.auth.signInAnonymously();

        if (error) {
          alert(t.loginError + error.message);
          return;
        }

        user = result.user;
      }

      if (!user || cancelled) return;

      setUserId(user.id);

      const telegramUser =
        window.Telegram?.WebApp?.initDataUnsafe?.user;

      const displayName = telegramUser
        ? [
            telegramUser.first_name,
            telegramUser.last_name
          ].filter(Boolean).join(" ") ||
            telegramUser.username ||
            null
        : null;

      const username = telegramUser?.username || null;

      const { error: insertError } = await supabase
        .from("app_users")
        .insert({
          id: user.id,
          display_name: displayName,
          username
        });

      if (insertError?.code === "23505") {
        const { error: updateError } = await supabase
          .from("app_users")
          .update({
            display_name: displayName,
            username,
            last_seen: new Date().toISOString()
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Foydalanuvchini yangilash:", updateError.message);
        }
      } else if (insertError) {
        console.error("Foydalanuvchini saqlash:", insertError.message);
      }
    }

    setupUser();

    return () => {
      cancelled = true;
    };
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
      alert(t.playlistName);
      return;
    }

    if (!userId) {
      alert("Foydalanuvchi aniqlanmadi. Qayta urinib ko‘ring.");
      return;
    }

    const { error } = await supabase
      .from("playlists")
      .insert({
        name,
        user_id: userId
      });

    if (error) {
      alert(t.error + error.message);
      return;
    }

    setNewPlaylistName("");
    setShowCreate(false);
    await loadPlaylists();
  }

  async function openPlaylist(playlist) {
    setSelectedPlaylist(playlist);

    const { data, error } = await supabase
      .from("playlist_songs")
      .select("song_id")
      .eq("playlist_id", playlist.id);

    if (error) {
      alert(t.error + error.message);
      return;
    }

    const ids = (data || []).map(item => item.song_id);
    setPlaylistSongs(songs.filter(song => ids.includes(song.id)));
  }

  async function addSongToPlaylist() {
    if (!selectedSongId || !selectedPlaylist) {
      alert(t.selectSong);
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
        ? t.duplicate
        : t.error + error.message);
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
      alert(t.error + error.message);
      return;
    }

    await openPlaylist(selectedPlaylist);
    await loadPlaylists();
  }

  async function uploadPlaylistCover(file) {
    if (!file || !selectedPlaylist || !userId) return;

    if (!file.type.startsWith("image/")) {
      alert(t.imageOnly);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(t.imageSize);
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
      alert(t.uploadError + uploadError.message);
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
      alert(t.error + error.message);
      return;
    }

    setSelectedPlaylist({
      ...selectedPlaylist,
      cover_url: data.publicUrl
    });

    await loadPlaylists();
    alert(t.updated);
  }

  async function deletePlaylist(playlist) {
    if (!window.confirm(
      `"${playlist.name}" ${t.deleteConfirm}`
    )) return;

    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", playlist.id);

    if (error) {
      alert(t.error + error.message);
      return;
    }

    setSelectedPlaylist(null);
    await loadPlaylists();
  }

  function playSong(song) {
    if (!song?.audio_url) {
      alert(t.audioMissing);
      return;
    }

    if (currentSong?.id === song.id && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        if (audioRef.current.ended) {
          countedPlayRef.current = null;
        }
        audioRef.current.play().catch(() => setPlaying(false));
      }
      return;
    }

    countedPlayRef.current = null;
    setCurrentSong(song);
    setPlaying(true);

    if (audioRef.current) {
      audioRef.current.src = song.audio_url;
      audioRef.current.play().catch(() => setPlaying(false));
    }
  }

  async function countSongPlay(songId) {
    if (!songId || countedPlayRef.current === songId) return;

    countedPlayRef.current = songId;

    const { error } = await supabase.rpc("increment_song_play", {
      song_id: songId
    });

    if (error) {
      console.error("Tinglashni hisoblash:", error.message);
      countedPlayRef.current = null;
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
        onEnded={() => {
          countedPlayRef.current = null;
          nextSong();
        }}
        onPlay={() => {
          setPlaying(true);
          if (currentSong?.id) {
            countSongPlay(currentSong.id);
          }
        }}
        onPause={() => setPlaying(false)}
      />

      <header className="header">
        <div className="brand">
          <div className="logo"><Headphones size={23} /></div>
          <b>Espo<span className="purple">fiy</span></b>
        </div>

        <div style={{ display: "flex", gap: 9 }}>
          <button
            className="profile"
            onClick={() => setShowSettings(true)}
            aria-label={t.settings}
          >
            <Settings size={19} />
          </button>

          <button
            className="profile"
            onClick={() => setShowAdmin(true)}
          >
            <Lock size={19} />
          </button>
        </div>
      </header>

      {showSettings && (
        <div style={modalStyle} onClick={() => setShowSettings(false)}>
          <div style={modalCardStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <b><Settings size={18} /> {t.settings}</b>
              <button onClick={() => setShowSettings(false)}
                style={iconButton}><X /></button>
            </div>

            <p style={{ marginBottom: 14 }}>
              <Globe size={18} style={{ verticalAlign: "middle" }} />{" "}
              {t.language}
            </p>

            {[
              { id: "uz", flag: "🇺🇿", name: "O‘zbekcha" },
              { id: "ru", flag: "🇷🇺", name: "Русский" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => changeLanguage(item.id)}
                style={{
                  ...languageButtonStyle,
                  border: language === item.id
                    ? "2px solid #a78bfa"
                    : "1px solid #40364f"
                }}
              >
                <span>{item.flag} {item.name}</span>
                {language === item.id && <Check color="#a78bfa" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <main>
        {tab === "home" && (
          <>
            <section className="welcome">
              <p className="small">{t.welcome}</p>
              <h1>{t.hello}</h1>
              <p>{t.subtitle}</p>
            </section>

            <h2 className="section-title">{t.newSongs}</h2>

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
                <p className="small">{t.noSongs}</p>}
            </div>
          </>
        )}

        {tab === "search" && (
          <>
            <h2 className="section-title">{t.searchTitle}</h2>

            <input
              className="search-input"
              placeholder={t.searchPlaceholder}
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
                <p className="small">{t.notFound}</p>}
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
                      {playlistSongs.length} {t.songs}
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
                          alt="Playlist cover"
                          style={coverImageStyle}
                        />
                      : <ListMusic size={55} />}
                  </div>

                  <label style={coverButtonStyle}>
                    <ImagePlus size={20} />
                    {t.chooseCover}
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
                    <p className="small">{t.emptyPlaylist}</p>}
                </div>

                {showAddSong && (
                  <div style={modalStyle}>
                    <div style={modalCardStyle}>
                      <div style={modalHeaderStyle}>
                        <b>{t.addSong}</b>
                        <button onClick={() => setShowAddSong(false)}
                          style={iconButton}><X /></button>
                      </div>

                      <select
                        value={selectedSongId}
                        onChange={e => setSelectedSongId(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">{t.chooseSong}</option>
                        {songs.map(song => (
                          <option key={song.id} value={song.id}>
                            {song.title} — {song.artist}
                          </option>
                        ))}
                      </select>

                      <button onClick={addSongToPlaylist}
                        style={mainButtonStyle}>
                        {t.addToPlaylist}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={headerStyle}>
                  <h2 className="section-title">{t.myPlaylists}</h2>
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
                        <span>{playlist.songCount} {t.songs}</span>
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
                      <h3>{t.noPlaylist}</h3>
                      <p>{t.createFirst}</p>
                      <button onClick={() => setShowCreate(true)}
                        style={mainButtonStyle}>
                        <Plus size={18} /> {t.createPlaylist}
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
                    <b>{t.newPlaylist}</b>
                    <button onClick={() => setShowCreate(false)}
                      style={iconButton}><X /></button>
                  </div>

                  <input
                    value={newPlaylistName}
                    onChange={e => setNewPlaylistName(e.target.value)}
                    placeholder={t.playlistPlaceholder}
                    style={inputStyle}
                  />

                  <button onClick={createPlaylist}
                    style={mainButtonStyle}>
                    <Plus size={18} /> {t.create}
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
              {playing
                ? <Pause size={22} />
                : <Play size={22} fill="white" />}
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
          <Home /><span>{t.home}</span>
        </button>

        <button onClick={() => {
          setTab("search");
          setSelectedPlaylist(null);
        }} className={tab === "search" ? "active" : ""}>
          <Search /><span>{t.search}</span>
        </button>

        <button onClick={() => {
          setTab("library");
          setSelectedPlaylist(null);
        }} className={tab === "library" ? "active" : ""}>
          <Library /><span>{t.library}</span>
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

const languageButtonStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 15,
  marginBottom: 10,
  borderRadius: 13,
  background: "#252033",
  color: "white",
  fontSize: 16,
  cursor: "pointer"
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
