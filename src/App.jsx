
import React, { useEffect, useRef, useState } from "react";
import {
  Home, Search, Library, Play, Pause,
  SkipBack, SkipForward, Music2, Headphones,
  Lock, Plus, ArrowLeft, Trash2, X,
  ListMusic, ImagePlus, Settings, Globe, Check,
  Upload, Clock, Music, Sun, Moon
} from "lucide-react";

import { supabase } from "./supabase";
import Admin from "./Admin";
import "./style.css";

const translations = {
  uz: {
    settings: "Sozlamalar",
    language: "Ilova tili",
    theme: "Ilova mavzusi",
    dark: "Qorong‘i",
    light: "Oq",
    home: "Bosh sahifa",
    search: "Qidiruv",
    library: "Kutubxona",
    upload: "Yuklash",
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
    languageSaved: "Til saqlandi",
    uploadTitle: "Musiqa yuklash",
    uploadSubtitle: "Qo‘shig‘ingizni yuboring. Admin tekshirgandan keyin ilovada paydo bo‘ladi.",
    songTitle: "Qo‘shiq nomi",
    artistName: "Ijrochi nomi",
    genreName: "Janr (ixtiyoriy)",
    audioFile: "Audio faylni tanlang",
    coverFile: "Muqova rasmi (ixtiyoriy)",
    sendSong: "Admin tasdig‘iga yuborish",
    sending: "Yuklanmoqda...",
    fillFields: "Qo‘shiq nomi, ijrochi va audio faylni kiriting!",
    audioOnly: "Audio fayl tanlang!",
    audioSize: "Audio fayl hajmi 50 MB dan oshmasin!",
    sendingError: "Yuklashda xatolik: ",
    sentSuccess: "Musiqa adminga tekshirish uchun yuborildi! 💜",
    mySubmissions: "Yuborgan qo‘shiqlarim",
    waiting: "Tekshiruvda",
    approved: "Tasdiqlangan",
    noSubmissions: "Siz hali musiqa yubormagansiz.",
    chooseAudio: "Audio fayl tanlanmagan",
    chooseImage: "Rasm tanlash",
    nowPlaying: "HOZIR IJRO ETILMOQDA"
  },

  ru: {
    settings: "Настройки",
    language: "Язык приложения",
    theme: "Тема приложения",
    dark: "Тёмная",
    light: "Светлая",
    home: "Главная",
    search: "Поиск",
    library: "Библиотека",
    upload: "Загрузка",
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
    languageSaved: "Язык сохранён",
    uploadTitle: "Загрузить музыку",
    uploadSubtitle: "Отправьте песню. Она появится в приложении после проверки администратором.",
    songTitle: "Название песни",
    artistName: "Имя исполнителя",
    genreName: "Жанр (необязательно)",
    audioFile: "Выбрать аудиофайл",
    coverFile: "Обложка (необязательно)",
    sendSong: "Отправить на проверку",
    sending: "Загрузка...",
    fillFields: "Введите название песни, исполнителя и выберите аудиофайл!",
    audioOnly: "Выберите аудиофайл!",
    audioSize: "Размер аудиофайла не должен превышать 50 МБ!",
    sendingError: "Ошибка загрузки: ",
    sentSuccess: "Музыка отправлена администратору на проверку! 💜",
    mySubmissions: "Мои отправленные песни",
    waiting: "На проверке",
    approved: "Одобрено",
    noSubmissions: "Вы ещё не отправляли музыку.",
    chooseAudio: "Аудиофайл не выбран",
    chooseImage: "Выбрать изображение",
    nowPlaying: "СЕЙЧАС ИГРАЕТ"
  }
};

function safeFileName(name) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-100);
}

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function SongCover() {
  return (
    <div className="universal-cover" aria-label="Espofiy music cover">
      <div className="cover-glow" />

      <svg
        viewBox="0 0 100 100"
        className="cover-art"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="39" fill="none"
          stroke="rgba(190,140,255,0.13)" strokeWidth="1" />

        <circle cx="50" cy="50" r="31" fill="none"
          stroke="rgba(190,140,255,0.10)" strokeWidth="1" />

        <path
          d="M12 52 H29 L37 38 L47 66 L57 28 L67 56 L73 45 L80 52 H89"
          fill="none"
          stroke="#d8b4fe"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M12 52 H29 L37 38 L47 66 L57 28 L67 56 L73 45 L80 52 H89"
          fill="none"
          stroke="#a855f7"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.18"
        />
      </svg>

      <span className="cover-brand">ESPOFIY</span>
    </div>
  );
}

export default function App() {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistSongs, setPlaylistSongs] = useState([]);

  const [announcements, setAnnouncements] = useState([]);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const [userId, setUserId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);

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

  const [theme, setTheme] = useState(
    () => localStorage.getItem("espofiy-theme") || "dark"
  );

  const [showSettings, setShowSettings] = useState(false);

  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadArtist, setUploadArtist] = useState("");
  const [uploadGenre, setUploadGenre] = useState("");
  const [uploadAudio, setUploadAudio] = useState(null);
  const [uploadCover, setUploadCover] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mySubmissions, setMySubmissions] = useState([]);

  const audioRef = useRef(null);
  const countedPlayRef = useRef(null);

  const t = translations[language] || translations.uz;

  function changeLanguage(lang) {
    setLanguage(lang);
    localStorage.setItem("espofiy-language", lang);
  }

  function changeTheme(value) {
    setTheme(value);
    localStorage.setItem("espofiy-theme", value);
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // FOYDALANUVCHINI ANIQLASH
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

  // E'LONLARNI YUKLASH
  async function loadAnnouncements() {
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, message, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("E'lonlarni yuklash:", error.message);
      return;
    }

    setAnnouncements(data || []);
  }

  useEffect(() => {
    loadAnnouncements();

    const refreshInterval = setInterval(loadAnnouncements, 15000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) {
      setAnnouncementIndex(0);
      return;
    }

    const rotationInterval = setInterval(() => {
      setAnnouncementIndex(prev => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(rotationInterval);
  }, [announcements.length]);

  useEffect(() => {
    setAnnouncementIndex(0);
  }, [announcements]);

  useEffect(() => {
    if (userId) {
      loadPlaylists();
      loadMySubmissions();
    }
  }, [userId]);

  async function loadMySubmissions() {
    if (!userId) return;

    const { data, error } = await supabase
      .from("songs")
      .select("id, title, artist, is_published, created_at")
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Yuborilgan musiqalar:", error.message);
      return;
    }

    setMySubmissions(data || []);
  }

  // MUSIQA YUBORISH
  async function submitSong() {
    if (!uploadTitle.trim() || !uploadArtist.trim() || !uploadAudio) {
      alert(t.fillFields);
      return;
    }

    if (!userId) {
      alert("Foydalanuvchi aniqlanmadi. Ilovani qayta oching.");
      return;
    }

    if (uploadAudio.size > 50 * 1024 * 1024) {
      alert(t.audioSize);
      return;
    }

    if (uploadCover) {
      if (!uploadCover.type.startsWith("image/")) {
        alert(t.imageOnly);
        return;
      }

      if (uploadCover.size > 5 * 1024 * 1024) {
        alert(t.imageSize);
        return;
      }
    }

    setUploading(true);

    const folder = `${userId}/submissions`;
    const audioPath =
      `${folder}/audio/${Date.now()}-${safeFileName(uploadAudio.name)}`;

    let coverPath = null;

    try {
      const { error: audioError } = await supabase.storage
        .from("music")
        .upload(audioPath, uploadAudio);

      if (audioError) throw audioError;

      const { data: audioData } = supabase.storage
        .from("music")
        .getPublicUrl(audioPath);

      const audioUrl = audioData.publicUrl;
      let coverUrl = null;

      if (uploadCover) {
        coverPath =
          `${folder}/covers/${Date.now()}-${safeFileName(uploadCover.name)}`;

        const { error: coverError } = await supabase.storage
          .from("music")
          .upload(coverPath, uploadCover);

        if (coverError) throw coverError;

        const { data: coverData } = supabase.storage
          .from("music")
          .getPublicUrl(coverPath);

        coverUrl = coverData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("songs")
        .insert({
          title: uploadTitle.trim(),
          artist: uploadArtist.trim(),
          genre: uploadGenre.trim() || null,
          audio_url: audioUrl,
          cover_url: coverUrl,
          is_published: false,
          submitted_by: userId
        });

      if (insertError) throw insertError;

      setUploadTitle("");
      setUploadArtist("");
      setUploadGenre("");
      setUploadAudio(null);
      setUploadCover(null);

      const audioInput = document.getElementById("submission-audio");
      const coverInput = document.getElementById("submission-cover");

      if (audioInput) audioInput.value = "";
      if (coverInput) coverInput.value = "";

      await loadMySubmissions();
      alert(t.sentSuccess);
    } catch (error) {
      console.error("Musiqa yuborish:", error);

      await supabase.storage.from("music").remove([audioPath]);

      if (coverPath) {
        await supabase.storage.from("music").remove([coverPath]);
      }

      alert(t.sendingError + (error.message || "Noma’lum xatolik"));
    } finally {
      setUploading(false);
    }
  }

  // PLAYLISTLAR
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
      counts[item.playlist_id] = (counts[item.playlist_id] || 0) + 1;
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
      .insert({ name, user_id: userId });

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
      alert(error.code === "23505" ? t.duplicate : t.error + error.message);
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
      `${userId}/covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

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
    if (!window.confirm(`"${playlist.name}" ${t.deleteConfirm}`)) return;

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

  // MUSIQA PLAYERI
  function playSong(song) {
    if (!song?.audio_url) {
      alert(t.audioMissing);
      return;
    }

    if (currentSong?.id === song.id && audioRef.current) {
      if (audioRef.current.paused) {
        if (audioRef.current.ended) {
          audioRef.current.currentTime = 0;
          countedPlayRef.current = null;
        }

        audioRef.current.play().catch(() => setPlaying(false));
      } else {
        audioRef.current.pause();
      }

      return;
    }

    countedPlayRef.current = null;
    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(true);

    const audio = audioRef.current;

    if (audio) {
      audio.src = song.audio_url;
      audio.load();
      audio.play().catch(() => setPlaying(false));
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
    const nextIndex = index < 0 ? 0 : (index + 1) % songs.length;

    playSong(songs[nextIndex]);
  }

  function previousSong() {
    if (!songs.length || !currentSong) return;

    // Agar musiqa 3 sekunddan ko‘p eshitilgan bo‘lsa,
    // oldingi musiqaga emas, shu musiqaning boshiga qaytadi.
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const index = songs.findIndex(s => s.id === currentSong.id);
    const previousIndex = index < 0
      ? 0
      : (index - 1 + songs.length) % songs.length;

    playSong(songs[previousIndex]);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (audio.paused) {
      if (audio.ended) {
        audio.currentTime = 0;
        countedPlayRef.current = null;
      }

      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }

  function seekAudio(event) {
    const value = Number(event.target.value);

    if (!audioRef.current || !Number.isFinite(value)) return;

    audioRef.current.currentTime = value;
    setCurrentTime(value);
  }

  function handleAudioEnded() {
    countedPlayRef.current = null;
    nextSong();
  }

  const filteredSongs = songs.filter(song =>
    `${song.title} ${song.artist}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (showAdmin) {
    return <Admin onClose={() => setShowAdmin(false)} />;
  }

  const progress = duration > 0
    ? Math.min((currentTime / duration) * 100, 100)
    : 0;

  return (
    <div className={`app theme-${theme}`}>
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={handleAudioEnded}
        onPlay={() => {
          setPlaying(true);

          if (currentSong?.id) {
            countSongPlay(currentSong.id);
          }
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime || 0);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
      />

      <header className="header">
        <div className="brand">
          <div className="logo">
            <Headphones size={23} />
          </div>

          <b>
            Espo<span className="purple">fiy</span>
          </b>
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

      {/* SOZLAMALAR */}
      {showSettings && (
        <div
          style={modalStyle}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={modalCardStyle}
            onClick={e => e.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <b>
                <Settings size={18} /> {t.settings}
              </b>

              <button
                onClick={() => setShowSettings(false)}
                style={iconButton}
              >
                <X />
              </button>
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
                  background: theme === "light" ? "#f1f1f5" : "#252033",
                  color: theme === "light" ? "#171321" : "white",
                  border: language === item.id
                    ? "2px solid #a78bfa"
                    : "1px solid #40364f"
                }}
              >
                <span>{item.flag} {item.name}</span>
                {language === item.id && <Check color="#a78bfa" />}
              </button>
            ))}

            <div style={{ marginTop: 22 }}>
              <p style={{ marginBottom: 14 }}>
                <Sun size={18} style={{ verticalAlign: "middle" }} />{" "}
                {t.theme}
              </p>

              {[
                { id: "dark", icon: <Moon size={19} />, name: t.dark },
                { id: "light", icon: <Sun size={19} />, name: t.light }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => changeTheme(item.id)}
                  style={{
                    ...languageButtonStyle,
                    background: theme === "light" ? "#f1f1f5" : "#252033",
                    color: theme === "light" ? "#171321" : "white",
                    border: theme === item.id
                      ? "2px solid #a78bfa"
                      : "1px solid #40364f"
                  }}
                >
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}>
                    {item.icon}
                    {item.name}
                  </span>

                  {theme === item.id && <Check color="#8b5cf6" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ASOSIY SAHIFALAR */}
      <main
        key={`${tab}-${selectedPlaylist?.id || "list"}`}
        className="page-liquid"
      >
        {tab === "home" && (
          <>
            <section className="welcome announcement-welcome">
              {announcements.length > 0 ? (
                <>
                  <p className="small">ESPOFIY • E'LON</p>

                  <h1 key={announcements[announcementIndex]?.id}>
                    {announcements[announcementIndex]?.title}
                  </h1>

                  <p key={`message-${announcements[announcementIndex]?.id}`}>
                    {announcements[announcementIndex]?.message}
                  </p>

                  {announcements.length > 1 && (
                    <div className="announcement-dots">
                      {announcements.map((item, index) => (
                        <span
                          key={item.id}
                          className={index === announcementIndex ? "active" : ""}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="small">{t.welcome}</p>
                  <h1>{t.hello}</h1>
                  <p>{t.subtitle}</p>
                </>
              )}
            </section>

            <h2 className="section-title">{t.newSongs}</h2>

            <div className="songs songs-grid">
              {songs.map(song => (
                <div className="song song-grid-card" key={song.id}>
                  <SongCover />

                  <div className="song-info">
                    <b>{song.title}</b>
                    <span>{song.artist}</span>
                  </div>

                  <button
                    className="play-small"
                    onClick={() => playSong(song)}
                    aria-label={`Play ${song.title}`}
                  >
                    {currentSong?.id === song.id && playing
                      ? <Pause size={18} />
                      : <Play size={18} fill="white" />}
                  </button>
                </div>
              ))}

              {songs.length === 0 && (
                <p className="small">{t.noSongs}</p>
              )}
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
                  <SongCover />

                  <div className="song-info">
                    <b>{song.title}</b>
                    <span>{song.artist}</span>
                  </div>

                  <button
                    className="play-small"
                    onClick={() => playSong(song)}
                  >
                    {currentSong?.id === song.id && playing
                      ? <Pause size={18} />
                      : <Play size={18} fill="white" />}
                  </button>
                </div>
              ))}

              {filteredSongs.length === 0 && (
                <p className="small">{t.notFound}</p>
              )}
            </div>
          </>
        )}

        {tab === "upload" && (
          <>
            <h2 className="section-title">{t.uploadTitle}</h2>

            <p className="small" style={{ marginBottom: 20, lineHeight: 1.6 }}>
              {t.uploadSubtitle}
            </p>

            <div style={uploadCardStyle}>
              <label style={formLabelStyle}>{t.songTitle}</label>

              <input
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder={t.songTitle}
                style={inputStyle}
              />

              <label style={formLabelStyle}>{t.artistName}</label>

              <input
                value={uploadArtist}
                onChange={e => setUploadArtist(e.target.value)}
                placeholder={t.artistName}
                style={inputStyle}
              />

              <label style={formLabelStyle}>{t.genreName}</label>

              <input
                value={uploadGenre}
                onChange={e => setUploadGenre(e.target.value)}
                placeholder={t.genreName}
                style={inputStyle}
              />

              <label style={formLabelStyle}>{t.audioFile}</label>

              <label style={fileButtonStyle}>
                <Music size={20} />

                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {uploadAudio?.name || t.chooseAudio}
                </span>

                <input
                  id="submission-audio"
                  type="file"
                  accept="audio/*"
                  style={{ display: "none" }}
                  onChange={e => setUploadAudio(e.target.files?.[0] || null)}
                />
              </label>

              <label style={formLabelStyle}>{t.coverFile}</label>

              <label style={fileButtonStyle}>
                <ImagePlus size={20} />

                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {uploadCover?.name || t.chooseImage}
                </span>

                <input
                  id="submission-cover"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={e => setUploadCover(e.target.files?.[0] || null)}
                />
              </label>

              {uploadCover && (
                <img
                  src={URL.createObjectURL(uploadCover)}
                  alt=""
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 14,
                    marginBottom: 15
                  }}
                />
              )}

              <button
                onClick={submitSong}
                disabled={uploading}
                style={{ ...mainButtonStyle, opacity: uploading ? 0.6 : 1 }}
              >
                {uploading
                  ? <><Clock size={18} /> {t.sending}</>
                  : <><Upload size={18} /> {t.sendSong}</>}
              </button>
            </div>

            <h2 className="section-title" style={{ marginTop: 28 }}>
              {t.mySubmissions}
            </h2>

            <div className="songs">
              {mySubmissions.map(item => (
                <div className="song" key={item.id}>
                  <SongCover />

                  <div className="song-info">
                    <b>{item.title}</b>
                    <span>{item.artist}</span>
                  </div>

                  <span style={{
                    fontSize: 11,
                    color: item.is_published ? "#4ade80" : "#fbbf24",
                    background: item.is_published
                      ? "rgba(74,222,128,0.12)"
                      : "rgba(251,191,36,0.12)",
                    padding: "6px 9px",
                    borderRadius: 8,
                    whiteSpace: "nowrap"
                  }}>
                    {item.is_published ? t.approved : t.waiting}
                  </span>
                </div>
              ))}

              {mySubmissions.length === 0 && (
                <p className="small">{t.noSubmissions}</p>
              )}
            </div>
          </>
        )}

        {tab === "library" && (
          <>
            {selectedPlaylist ? (
              <>
                <div style={headerStyle}>
                  <button
                    onClick={() => setSelectedPlaylist(null)}
                    style={iconButton}
                  >
                    <ArrowLeft />
                  </button>

                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0 }}>{selectedPlaylist.name}</h2>
                    <p className="small">
                      {playlistSongs.length} {t.songs}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddSong(true)}
                    style={iconButton}
                  >
                    <Plus />
                  </button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={coverPreviewStyle}>
                    {selectedPlaylist.cover_url
                      ? (
                        <img
                          src={selectedPlaylist.cover_url}
                          alt="Playlist cover"
                          style={coverImageStyle}
                        />
                      )
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
                      <SongCover />

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
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}

                  {playlistSongs.length === 0 && (
                    <p className="small">{t.emptyPlaylist}</p>
                  )}
                </div>

                {showAddSong && (
                  <div style={modalStyle}>
                    <div style={modalCardStyle}>
                      <div style={modalHeaderStyle}>
                        <b>{t.addSong}</b>

                        <button
                          onClick={() => setShowAddSong(false)}
                          style={iconButton}
                        >
                          <X />
                        </button>
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

                      <button
                        onClick={addSongToPlaylist}
                        style={mainButtonStyle}
                      >
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

                  <button
                    onClick={() => setShowCreate(true)}
                    style={iconButton}
                  >
                    <Plus />
                  </button>
                </div>

                <div className="songs">
                  {playlists.map(playlist => (
                    <div
                      className="song"
                      key={playlist.id}
                      onClick={() => openPlaylist(playlist)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="cover playlist-row-cover">
                        {playlist.cover_url
                          ? <img src={playlist.cover_url} alt="" />
                          : <ListMusic />}
                      </div>

                      <div className="song-info">
                        <b>{playlist.name}</b>
                        <span>{playlist.songCount} {t.songs}</span>
                      </div>

                      <button
                        className="play-small"
                        onClick={e => {
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
                      <h3>{t.noPlaylist}</h3>
                      <p>{t.createFirst}</p>

                      <button
                        onClick={() => setShowCreate(true)}
                        style={mainButtonStyle}
                      >
                        <Plus size={18} />
                        {t.createPlaylist}
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

                    <button
                      onClick={() => setShowCreate(false)}
                      style={iconButton}
                    >
                      <X />
                    </button>
                  </div>

                  <input
                    value={newPlaylistName}
                    onChange={e => setNewPlaylistName(e.target.value)}
                    placeholder={t.playlistPlaceholder}
                    style={inputStyle}
                  />

                  <button
                    onClick={createPlaylist}
                    style={mainButtonStyle}
                  >
                    <Plus size={18} />
                    {t.create}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MINI PLAYER — BOSILGANDA KATTA PLAYER OCHILADI */}
      {currentSong && (
        <div
          className="player"
          onClick={() => setShowFullPlayer(true)}
          style={{ cursor: "pointer" }}
        >
          <div className="player-song">
            <div className="mini-cover">
              <SongCover />
            </div>

            <div className="player-song-info">
              <b>{currentSong.title}</b>
              <span>{currentSong.artist}</span>
            </div>
          </div>

          <div className="controls">
            <button
              onClick={e => {
                e.stopPropagation();
                previousSong();
              }}
              aria-label="Previous song"
            >
              <SkipBack size={19} />
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label="Play or pause"
            >
              {playing
                ? <Pause size={22} />
                : <Play size={22} fill="white" />}
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                nextSong();
              }}
              aria-label="Next song"
            >
              <SkipForward size={19} />
            </button>
          </div>
        </div>
      )}

      {/* TO‘LIQ EKRANLI LIQUID GLASS PLAYER */}
      {showFullPlayer && currentSong && (
        <div className="full-player">
          <div className="full-player-glow full-player-glow-one" />
          <div className="full-player-glow full-player-glow-two" />

          <div className="full-player-top">
            <button
              className="glass-icon-button"
              onClick={() => setShowFullPlayer(false)}
              aria-label="Close player"
            >
              <ArrowLeft size={23} />
            </button>

            <div className="full-player-heading">
              <span>ESPOFIY</span>
              <small>{t.nowPlaying}</small>
            </div>

            <button
              className="glass-icon-button"
              onClick={() => setShowFullPlayer(false)}
              aria-label="Close"
            >
              <X size={21} />
            </button>
          </div>

          <div className="full-player-content">
            <div className="full-player-art">
              <div className="full-player-art-glow" />
              <SongCover />
            </div>

            <div className="full-player-song-info">
              <div className="full-player-title">
                <h2>{currentSong.title}</h2>
                <p>{currentSong.artist}</p>
              </div>

              <div className="full-player-progress">
                <input
                  className="full-player-range"
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={Math.min(currentTime, duration || 0)}
                  onChange={seekAudio}
                  style={{
                    "--player-progress": `${progress}%`
                  }}
                  aria-label="Musiqa vaqtini o‘zgartirish"
                />

                <div className="full-player-time">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="full-player-controls">
                <button
                  className="glass-control-button"
                  onClick={previousSong}
                  aria-label="Previous song"
                >
                  <SkipBack size={29} fill="currentColor" />
                </button>

                <button
                  className="main-play-button"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing
                    ? <Pause size={31} fill="currentColor" />
                    : <Play size={31} fill="currentColor" />}
                </button>

                <button
                  className="glass-control-button"
                  onClick={nextSong}
                  aria-label="Next song"
                >
                  <SkipForward size={29} fill="currentColor" />
                </button>
              </div>

              <div className="full-player-bottom">
                <span>
                  <Music2 size={16} />
                  {t.nowPlaying}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASTKI LIQUID MENYU */}
      <nav className="bottom-nav">
        <button
          onClick={() => {
            setTab("home");
            setSelectedPlaylist(null);
          }}
          className={tab === "home" ? "active" : ""}
        >
          <Home />
          <span>{t.home}</span>
        </button>

        <button
          onClick={() => {
            setTab("search");
            setSelectedPlaylist(null);
          }}
          className={tab === "search" ? "active" : ""}
        >
          <Search />
          <span>{t.search}</span>
        </button>

        <button
          onClick={() => {
            setTab("upload");
            setSelectedPlaylist(null);
            loadMySubmissions();
          }}
          className={tab === "upload" ? "active" : ""}
        >
          <Upload />
          <span>{t.upload}</span>
        </button>

        <button
          onClick={() => {
            setTab("library");
            setSelectedPlaylist(null);
          }}
          className={tab === "library" ? "active" : ""}
        >
          <Library />
          <span>{t.library}</span>
        </button>
      </nav>
    </div>
  );
}

/* STYLES */

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
  color: "white",
  maxHeight: "85vh",
  overflowY: "auto"
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

const uploadCardStyle = {
  background: "#171321",
  border: "1px solid #302840",
  borderRadius: 18,
  padding: 16,
  marginBottom: 24
};

const formLabelStyle = {
  display: "block",
  color: "#c4b5d9",
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 8
};

const fileButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 14,
  borderRadius: 11,
  border: "1px solid #40364f",
  background: "#252033",
  color: "white",
  marginBottom: 16,
  cursor: "pointer",
  minWidth: 0
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
