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
        <circle cx="50" cy="50" r="39" fill="none" stroke="rgba(190,140,255,0.13)" strokeWidth="1" />
        <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(190,140,255,0.10)" strokeWidth="1" />
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

  // YOUTUBE QIDIRUV VA PLAYER
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState("");
  const [selectedYoutubeVideo, setSelectedYoutubeVideo] = useState(null);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [youtubeCurrentTime, setYoutubeCurrentTime] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);

  const youtubePlayerRef = useRef(null);
  const youtubeMountRef = useRef(null);

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
    const audioPath = `${folder}/audio/${Date.now()}-${safeFileName(uploadAudio.name)}`;
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
        coverPath = `${folder}/covers/${Date.now()}-${safeFileName(uploadCover.name)}`;

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
  
  // PLAYLISTLARNI YUKLASH
  async function loadPlaylists() {
    if (!userId) return;

    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }

    setPlaylists(data || []);
  }

  async function loadPlaylistSongs(playlistId) {
    const { data, error } = await supabase
      .from("playlist_songs")
      .select("*")
      .eq("playlist_id", playlistId);

    if (error) {
      console.error(error.message);
      return;
    }

    setPlaylistSongs(data || []);
  }

  async function createPlaylist() {
    if (!newPlaylistName.trim()) {
      alert(t.playlistName);
      return;
    }

    const { error } = await supabase
      .from("playlists")
      .insert({
        name: newPlaylistName.trim(),
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

  async function deletePlaylist(id) {
    if (!window.confirm("Playlistni o‘chirmoqchimisiz?")) return;

    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      alert(t.error + error.message);
      return;
    }

    setSelectedPlaylist(null);
    await loadPlaylists();
  }

  async function addSongToPlaylist() {
    if (!selectedSongId || !selectedPlaylist) {
      alert(t.selectSong);
      return;
    }

    const exists = playlistSongs.some(
      item => item.song_id === selectedSongId
    );

    if (exists) {
      alert(t.duplicate);
      return;
    }

    const { error } = await supabase
      .from("playlist_songs")
      .insert({
        playlist_id: selectedPlaylist.id,
        song_id: selectedSongId
      });

    if (error) {
      alert(t.error + error.message);
      return;
    }

    setShowAddSong(false);
    setSelectedSongId("");
    await loadPlaylistSongs(selectedPlaylist.id);
  }

  // AUDIO PLAYER
  function playSong(song) {
    if (!song?.audio_url) {
      alert(t.audioMissing);
      return;
    }

    setCurrentSong(song);
    setShowFullPlayer(true);
    setPlaying(true);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    audio.src = currentSong.audio_url;
    audio.load();

    audio.play().catch(error => {
      console.error("Audio ijro xatosi:", error);
      setPlaying(false);
    });
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [playing]);

  function togglePlay() {
    setPlaying(prev => !prev);
  }

  function playNext() {
    if (!songs.length || !currentSong) return;

    const index = songs.findIndex(song => song.id === currentSong.id);
    const next = songs[(index + 1) % songs.length];

    playSong(next);
  }

  function playPrevious() {
    if (!songs.length || !currentSong) return;

    const index = songs.findIndex(song => song.id === currentSong.id);
    const previous = songs[
      (index - 1 + songs.length) % songs.length
    ];

    playSong(previous);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(audio.currentTime || 0);
    setDuration(audio.duration || 0);
  }

  function seekAudio(event) {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Number(event.target.value);
    setCurrentTime(audio.currentTime);
  }

  // YOUTUBE QIDIRUV
  async function searchYoutube() {
    if (!search.trim()) return;

    setYoutubeLoading(true);
    setYoutubeError("");
    setYoutubeResults([]);

    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

      if (!apiKey) {
        throw new Error("YouTube API kaliti topilmadi.");
      }

      const url = new URL(
        "https://www.googleapis.com/youtube/v3/search"
      );

      url.search = new URLSearchParams({
        part: "snippet",
        q: search + " music",
        type: "video",
        videoCategoryId: "10",
        maxResults: "15",
        key: apiKey
      }).toString();

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message || "YouTube qidiruv xatosi"
        );
      }

      setYoutubeResults(result.items || []);
    } catch (error) {
      setYoutubeError(error.message);
    } finally {
      setYoutubeLoading(false);
    }
  }

  function playYoutube(video) {
    setSelectedYoutubeVideo(video);
    setYoutubePlaying(true);
    setShowFullPlayer(true);
  }

  useEffect(() => {
    if (!selectedYoutubeVideo) return;

    let cancelled = false;

    function loadYoutubeAPI() {
      if (window.YT?.Player) {
        createPlayer();
        return;
      }

      const existing = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }

      const previousCallback = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        if (!cancelled) createPlayer();
      };
    }

    function createPlayer() {
      if (cancelled || !youtubeMountRef.current) return;

      if (youtubePlayerRef.current?.destroy) {
        youtubePlayerRef.current.destroy();
      }

      youtubePlayerRef.current = new window.YT.Player(
        youtubeMountRef.current,
        {
          height: "100%",
          width: "100%",
          videoId: selectedYoutubeVideo.id.videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            playsinline: 1
          },
          events: {
            onReady: event => {
              event.target.playVideo();
              setYoutubeDuration(
                event.target.getDuration() || 0
              );
            },
            onStateChange: event => {
              setYoutubePlaying(event.data === 1);
              setYoutubeCurrentTime(
                event.target.getCurrentTime() || 0
              );
              setYoutubeDuration(
                event.target.getDuration() || 0
              );
            }
          }
        }
      );
    }

    loadYoutubeAPI();

    return () => {
      cancelled = true;

      if (youtubePlayerRef.current?.destroy) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [selectedYoutubeVideo]);

  function toggleYoutubePlay() {
    const player = youtubePlayerRef.current;
    if (!player) return;

    if (youtubePlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  function seekYoutube(event) {
    const player = youtubePlayerRef.current;
    if (!player) return;

    const value = Number(event.target.value);
    player.seekTo(value, true);
    setYoutubeCurrentTime(value);
  }

  // QIDIRUV NATIJALARI
  const filteredSongs = songs.filter(song =>
    `${song.title} ${song.artist}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // SHU YERDAN 3-QISM DAVOM ETADI
  return (

      <div className={`app theme-${theme}`}>
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={playNext}
        />

        {showAdmin ? (
          <div className="admin-page">
            <button onClick={() => setShowAdmin(false)}>
              <ArrowLeft size={20} /> Orqaga
            </button>
            <Admin />
          </div>
        ) : (
          <>
            <header className="top-header">
              <div className="brand">
                <div className="brand-icon">
                  <Music2 size={24} />
                </div>
                <span>ESPOFIY</span>
              </div>

              <div className="header-actions">
                <button onClick={() => setShowSettings(true)}>
                  <Settings size={21} />
                </button>
                <button onClick={() => setShowAdmin(true)}>
                  <Lock size={20} />
                </button>
              </div>
            </header>

            <main className="main-content">
              {tab === "home" && (
                <section>
                  <div className="welcome-card">
                    <div className="welcome-glow" />
                    <p className="eyebrow">ESPOFIY MUSIC</p>
                    <h1>{t.welcome}</h1>
                    <h3>{t.hello}</h3>
                    <p>{t.subtitle}</p>
                  </div>

                  {announcements.length > 0 && (
                    <div className="announcement-card">
                      <div className="announcement-top">
                        <span>📢 E'LON</span>
                        <span>
                          {announcementIndex + 1}/
                          {announcements.length}
                        </span>
                      </div>
                      <h3>
                        {announcements[
                          announcementIndex % announcements.length
                        ]?.title}
                      </h3>
                      <p>
                        {announcements[
                          announcementIndex % announcements.length
                        ]?.message}
                      </p>
                    </div>
                  )}

                  <div className="section-heading">
                    <h2>{t.newSongs}</h2>
                    <span>{songs.length}</span>
                  </div>

                  {songs.length === 0 ? (
                    <div className="empty-state">
                      <Music2 size={38} />
                      <p>{t.noSongs}</p>
                    </div>
                  ) : (
                    <div className="song-grid">
                      {songs.map(song => (
                        <button
                          className="song-card"
                          key={song.id}
                          onClick={() => playSong(song)}
                        >
                          <div className="song-image">
                            {song.cover_url ? (
                              <img
                                src={song.cover_url}
                                alt={song.title}
                              />
                            ) : (
                              <SongCover />
                            )}
                            <div className="song-play">
                              <Play size={22} fill="currentColor" />
                            </div>
                          </div>
                          <div className="song-info">
                            <strong>{song.title}</strong>
                            <span>{song.artist}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {tab === "search" && (
                <section>
                  <div className="section-heading">
                    <h2>{t.searchTitle}</h2>
                  </div>

                  <div className="search-box">
                    <Search size={20} />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder={t.searchPlaceholder}
                    />
                    <button onClick={searchYoutube}>
                      YouTube
                    </button>
                  </div>

                  <div className="section-heading">
                    <h3>Espofiy musiqalari</h3>
                  </div>

                  {filteredSongs.length === 0 ? (
                    <p className="empty-text">{t.notFound}</p>
                  ) : (
                    <div className="song-list">
                      {filteredSongs.map(song => (
                        <div className="song-row" key={song.id}>
                          <button
                            className="song-row-main"
                            onClick={() => playSong(song)}
                          >
                            {song.cover_url ? (
                              <img src={song.cover_url} alt="" />
                            ) : (
                              <SongCover />
                            )}
                            <div>
                              <strong>{song.title}</strong>
                              <span>{song.artist}</span>
                            </div>
                          </button>
                          <button onClick={() => playSong(song)}>
                            <Play size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="section-heading">
                    <h3>YouTube natijalari</h3>
                  </div>

                  {youtubeLoading && (
                    <p className="empty-text">Qidirilmoqda...</p>
                  )}

                  {youtubeError && (
                    <p className="error-text">{youtubeError}</p>
                  )}

                  <div className="song-list">
                    {youtubeResults.map(video => (
                      <button
                        className="song-row"
                        key={video.id.videoId}
                        onClick={() => playYoutube(video)}
                      >
                        <img
                          src={
                            video.snippet.thumbnails.medium?.url
                          }
                          alt=""
                        />
                        <div>
                          <strong>{video.snippet.title}</strong>
                          <span>{video.snippet.channelTitle}</span>
                        </div>
                        <Play size={20} />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {tab === "library" && (
                <section>
                  <div className="section-heading">
                    <h2>{t.myPlaylists}</h2>
                    <button
                      className="primary-small"
                      onClick={() => setShowCreate(true)}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {selectedPlaylist ? (
                    <>
                      <button
                        className="back-button"
                        onClick={() => setSelectedPlaylist(null)}
                      >
                        <ArrowLeft size={19} /> Orqaga
                      </button>

                      <div className="playlist-detail">
                        <h2>{selectedPlaylist.name}</h2>
                        <p>
                          {playlistSongs.length} {t.songs}
                        </p>
                        <button
                          className="primary-button"
                          onClick={() => setShowAddSong(true)}
                        >
                          <Plus size={18} /> {t.addSong}
                        </button>
                      </div>

                      {playlistSongs.map(item => {
                        const song = songs.find(
                          s => s.id === item.song_id
                        );

                        if (!song) return null;

                        return (
                          <button
                            className="song-row"
                            key={item.id}
                            onClick={() => playSong(song)}
                          >
                            {song.cover_url ? (
                              <img src={song.cover_url} alt="" />
                            ) : (
                              <SongCover />
                            )}
                            <div>
                              <strong>{song.title}</strong>
                              <span>{song.artist}</span>
                            </div>
                            <Play size={20} />
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {playlists.length === 0 ? (
                        <div className="empty-state">
                          <Library size={38} />
                          <h3>{t.noPlaylist}</h3>
                          <p>{t.createFirst}</p>
                          <button
                            className="primary-button"
                            onClick={() => setShowCreate(true)}
                          >
                            <Plus size={18} />
                            {t.createPlaylist}
                          </button>
                        </div>
                      ) : (
                        <div className="playlist-grid">
                          {playlists.map(playlist => (
                            <div
                              className="playlist-card"
                              key={playlist.id}
                            >
                              <button
                                className="playlist-open"
                                onClick={() => {
                                  setSelectedPlaylist(playlist);
                                  loadPlaylistSongs(playlist.id);
                                }}
                              >
                                <div className="playlist-cover">
                                  <Music2 size={35} />
                                </div>
                                <strong>{playlist.name}</strong>
                              </button>
                              <button
                                className="delete-button"
                                onClick={() =>
                                  deletePlaylist(playlist.id)
                                }
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}

              {tab === "upload" && (
                <section>
                  <div className="section-heading">
                    <h2>{t.uploadTitle}</h2>
                  </div>

                  <p className="upload-description">
                    {t.uploadSubtitle}
                  </p>

                  <div className="upload-form">
                    <label>{t.songTitle}</label>
                    <input
                      value={uploadTitle}
                      onChange={e => setUploadTitle(e.target.value)}
                      placeholder={t.songTitle}
                    />

                    <label>{t.artistName}</label>
                    <input
                      value={uploadArtist}
                      onChange={e => setUploadArtist(e.target.value)}
                      placeholder={t.artistName}
                    />

                    <label>{t.genreName}</label>
                    <input
                      value={uploadGenre}
                      onChange={e => setUploadGenre(e.target.value)}
                      placeholder={t.genreName}
                    />

                    <label>{t.audioFile}</label>
                    <input
                      id="submission-audio"
                      type="file"
                      accept="audio/*"
                      onChange={e =>
                        setUploadAudio(e.target.files?.[0] || null)
                      }
                    />

                    <label>{t.coverFile}</label>
                    <input
                      id="submission-cover"
                      type="file"
                      accept="image/*"
                      onChange={e =>
                        setUploadCover(e.target.files?.[0] || null)
                      }
                    />

                    <button
                      className="primary-button full-button"
                      disabled={uploading}
                      onClick={submitSong}
                    >
                      <Upload size={19} />
                      {uploading ? t.sending : t.sendSong}
                    </button>
                  </div>

                  <div className="section-heading">
                    <h3>{t.mySubmissions}</h3>
                  </div>

                  {mySubmissions.length === 0 ? (
                    <p className="empty-text">{t.noSubmissions}</p>
                  ) : (
                    <div className="song-list">
                      {mySubmissions.map(song => (
                        <div className="song-row" key={song.id}>
                          <Music2 size={24} />
                          <div>
                            <strong>{song.title}</strong>
                            <span>{song.artist}</span>
                          </div>
                          <span className="status-label">
                            {song.is_published
                              ? t.approved
                              : t.waiting}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </main>

            {currentSong && (
              <div className="mini-player">
                <button
                  className="mini-player-info"
                  onClick={() => setShowFullPlayer(true)}
                >
                  {currentSong.cover_url ? (
                    <img src={currentSong.cover_url} alt="" />
                  ) : (
                    <SongCover />
                  )}
                  <div>
                    <strong>{currentSong.title}</strong>
                    <span>{currentSong.artist}</span>
                  </div>
                </button>

                <button onClick={togglePlay}>
                  {playing ? (
                    <Pause size={23} />
                  ) : (
                    <Play size={23} />
                  )}
                </button>

                <button onClick={playNext}>
                  <SkipForward size={23} />
                </button>
              </div>
            )}

            <nav className="bottom-nav">
              <button
                className={tab === "home" ? "active" : ""}
                onClick={() => setTab("home")}
              >
                <Home size={21} />
                <span>{t.home}</span>
              </button>

              <button
                className={tab === "search" ? "active" : ""}
                onClick={() => setTab("search")}
              >
                <Search size={21} />
                <span>{t.search}</span>
              </button>

              <button
                className={tab === "library" ? "active" : ""}
                onClick={() => setTab("library")}
              >
                <Library size={21} />
                <span>{t.library}</span>
              </button>

              <button
                className={tab === "upload" ? "active" : ""}
                onClick={() => setTab("upload")}
              >
                <Upload size={21} />
                <span>{t.upload}</span>
              </button>
            </nav>
          </>
        )}

        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-card">
              <button
                className="modal-close"
                onClick={() => setShowCreate(false)}
              >
                <X size={21} />
              </button>
              <h2>{t.newPlaylist}</h2>
              <input
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                placeholder={t.playlistPlaceholder}
              />
              <div className="modal-actions">
                <button onClick={() => setShowCreate(false)}>
                  {t.cancel}
                </button>
                <button
                  className="primary-button"
                  onClick={createPlaylist}
                >
                  {t.create}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddSong && (
          <div className="modal-overlay">
            <div className="modal-card">
              <button
                className="modal-close"
                onClick={() => setShowAddSong(false)}
              >
                <X size={21} />
              </button>
              <h2>{t.addSong}</h2>
              <select
                value={selectedSongId}
                onChange={e => setSelectedSongId(e.target.value)}
              >
                <option value="">{t.chooseSong}</option>
                {songs.map(song => (
                  <option key={song.id} value={song.id}>
                    {song.title} — {song.artist}
                  </option>
                ))}
              </select>
              <div className="modal-actions">
                <button onClick={() => setShowAddSong(false)}>
                  {t.cancel}
                </button>
                <button
                  className="primary-button"
                  onClick={addSongToPlaylist}
                >
                  {t.addToPlaylist}
                </button>
              </div>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="modal-overlay">
            <div className="modal-card settings-card">
              <button
                className="modal-close"
                onClick={() => setShowSettings(false)}
              >
                <X size={21} />
              </button>
              <h2>{t.settings}</h2>

              <label>
                <Globe size={19} /> {t.language}
              </label>
              <div className="settings-options">
                <button
                  className={language === "uz" ? "selected" : ""}
                  onClick={() => changeLanguage("uz")}
                >
                  O‘zbekcha
                  {language === "uz" && <Check size={18} />}
                </button>
                <button
                  className={language === "ru" ? "selected" : ""}
                  onClick={() => changeLanguage("ru")}
                >
                  Русский
                  {language === "ru" && <Check size={18} />}
                </button>
              </div>

              <label>
                <Sun size={19} /> {t.theme}
              </label>
              <div className="settings-options">
                <button
                  className={theme === "dark" ? "selected" : ""}
                  onClick={() => changeTheme("dark")}
                >
                  <Moon size={18} /> {t.dark}
                  {theme === "dark" && <Check size={18} />}
                </button>
                <button
                  className={theme === "light" ? "selected" : ""}
                  onClick={() => changeTheme("light")}
                >
                  <Sun size={18} /> {t.light}
                  {theme === "light" && <Check size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {showFullPlayer && (
          <div className="full-player">
            <div className="full-player-header">
              <button onClick={() => setShowFullPlayer(false)}>
                <ArrowLeft size={25} />
              </button>
              <span>{t.nowPlaying}</span>
              <button onClick={() => setShowFullPlayer(false)}>
                <X size={24} />
              </button>
            </div>

            {selectedYoutubeVideo ? (
              <>
                <div className="youtube-player-box">
                  <div ref={youtubeMountRef} />
                </div>
                <h2>{selectedYoutubeVideo.snippet.title}</h2>
                <p>
                  {selectedYoutubeVideo.snippet.channelTitle}
                </p>
                <div className="player-controls">
                  <button onClick={toggleYoutubePlay}>
                    {youtubePlaying ? (
                      <Pause size={30} />
                    ) : (
                      <Play size={30} />
                    )}
                  </button>
                </div>
                <button
                  className="back-button"
                  onClick={() => {
                    setSelectedYoutubeVideo(null);
                    setYoutubePlaying(false);
                  }}
                >
                  Espofiy musiqalariga qaytish
                </button>
              </>
            ) : currentSong ? (
              <>
                <div className="full-cover">
                  {currentSong.cover_url ? (
                    <img src={currentSong.cover_url} alt="" />
                  ) : (
                    <SongCover />
                  )}
                </div>

                <div className="full-song-info">
                  <h2>{currentSong.title}</h2>
                  <p>{currentSong.artist}</p>
                </div>

                <input
                  className="progress-slider"
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="1"
                  value={Math.min(currentTime, duration || 0)}
                  onChange={seekAudio}
                />

                <div className="time-labels">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="player-controls">
                  <button onClick={playPrevious}>
                    <SkipBack size={30} />
                  </button>
                  <button
                    className="main-play-button"
                    onClick={togglePlay}
                  >
                    {playing ? (
                      <Pause size={32} />
                    ) : (
                      <Play size={32} fill="currentColor" />
                    )}
                  </button>
                  <button onClick={playNext}>
                    <SkipForward size={30} />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    );
}
