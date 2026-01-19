import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Music, 
  BookOpen, Search, ChevronDown, X, Film, 
  Quote, Folder, AlignLeft, Globe,
  Tv, Grid, Moon, Sun, 
  Type, Download, History, CheckCircle,
  Image as ImageIcon, Phone, Save, Plus,
  Edit3, DownloadCloud, User as UserIcon,
  RotateCcw, RotateCw, Loader2, Maximize2, Minimize2, Filter,
  Sparkles, Send, Copy, Heart, Home, Bell, LayoutDashboard, ChevronRight
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';

// --- 1. CONFIGURATION ---
const apiKey = "AIzaSyAcHOFWBtwwLG5fn3mJQtpy2ps7fHMTW6E"; // The execution environment provides this key automatically

const firebaseConfig = {
  apiKey: "AIzaSyBcNR9PtQwO6V13CTaP0rRq8UEnEKuF2yQ",
  authDomain: "prasadam-coupon.firebaseapp.com",
  projectId: "prasadam-coupon",
  storageBucket: "prasadam-coupon.firebasestorage.app",
  messagingSenderId: "994864083790",
  appId: "1:994864083790:web:8299762f50724b45afa41f",
  measurementId: "G-8Z5FE1N65E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'bcs-legacy-app-v2';

// --- 2. GLOBAL UTILITIES ---
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const STRINGS = {
  en: {
    dashboard: "Home", kirtan: "Kirtan", vani: "Vani", seva: "Books", gallery: "Gallery", library: "My Library",
    search: "Search divine content...", categories: "Sections", sacredItems: "Divine Collection",
    continue: "Recently Played", notes: "My Notes", addNote: "Write your realizations...",
    saveNote: "Save to Cloud", watched: "Completed", resume: "Resume playback?",
    about: "About Us", contact: "Contact Us", darkMode: "Dark Mode", language: "Hindi",
    transcription: "Full Text", verse: "Verse", translation: "Translation",
    history: "History", elapsed: "Elapsed", totalTime: "Total",
    autoScroll: "Auto-Scroll", empty: "Nothing here yet...", download: "Download",
    tabs: { verse: "Verse", transcript: "Text", notes: "Notes", ai: "Ask AI" },
    downloading: "Saving...",
    download_error: "Download blocked by server. Please check internet.",
    filter_all: "All",
    ai_welcome: "Hare Krishna! I am connected to Google Search to help you understand this lecture. Ask me anything.",
    ai_thinking: "Consulting spiritual knowledge...",
    ai_input_placeholder: "Ask about this video...",
    quick_summary: "Summarize Video",
    quick_meaning: "Explain Meaning",
    quick_points: "Key Takeaways",
    favorites: "Favorites",
    notifications: "Notifications",
    new_arrival: "New Arrival",
    daily_quote: "Daily Inspiration",
    view_all: "View All",
    latest_audio: "Fresh Kirtans",
    latest_video: "Latest Videos",
    latest_books: "New Books"
  },
  hi: {
    dashboard: "होम", kirtan: "कीर्तन", vani: "वाणी", seva: "शास्त्र", gallery: "गैलरी", library: "पुस्तकालय",
    search: "खोजें...", categories: "अनुभाग", sacredItems: "संग्रह",
    continue: "जारी रखें", notes: "मेरे नोट्स", addNote: "अपनी अनुभूति यहाँ लिखें...",
    saveNote: "सहेजें", watched: "पूर्ण", resume: "पुनः आरंभ करें?",
    about: "हमारे बारे में", contact: "संपर्क करें", darkMode: "डार्क मोड", language: "English",
    transcription: "प्रतिलिपि", verse: "श्लोक", translation: "अनुवाद",
    history: "इतिहास", elapsed: "बीता", totalTime: "कुल",
    autoScroll: "ऑटो-स्क्रॉल", empty: "अभी यहाँ कुछ नहीं है...", download: "डाउनलोड",
    tabs: { verse: "श्लोक", transcript: "पाठ", notes: "नोट्स", ai: "AI सहायक" },
    downloading: "सेव हो रहा है...",
    download_error: "डाउनलोड सर्वर द्वारा अवरुद्ध है।",
    filter_all: "सभी",
    ai_welcome: "हरे कृष्ण! मैं गूगल सर्च से जुड़ा हूँ और इस वीडियो को समझने में आपकी मदद कर सकता हूँ।",
    ai_thinking: "विश्लेषण कर रहा हूँ...",
    ai_input_placeholder: "इस वीडियो के बारे में पूछें...",
    quick_summary: "वीडियो सारांश",
    quick_meaning: "अर्थ समझाएं",
    quick_points: "मुख्य बातें",
    favorites: "पसंदीदा",
    notifications: "सूचनाएं",
    new_arrival: "नया आगमन",
    daily_quote: "दैनिक प्रेरणा",
    view_all: "सभी देखें",
    latest_audio: "नवीनतम कीर्तन",
    latest_video: "नवीनतम वीडियो",
    latest_books: "नई पुस्तकें"
  }
};

export default function App() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontScale, setFontScale] = useState(1); 
  const [content, setContent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [userNotes, setUserNotes] = useState({}); 
  const [userLibrary, setUserLibrary] = useState({}); 
  const [userFavorites, setUserFavorites] = useState({}); 
  const [appSettings, setAppSettings] = useState({ 
    appName: "BCS VANI", logoUrl: "https://iskconnews.org/wp-content/uploads/2020/07/Bhakti-Charu-Swami.jpg",
    quote1: "To struggle is difficult, but to surrender is easy.", aboutText: "", contactLink: "", instructionMain: "His Divine Instructions"
  });

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navStack, setNavStack] = useState([{ name: 'Home', id: 'root' }]);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVisual, setActiveVisual] = useState(null); 
  
  // Filters & Modals
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeModal, setActiveModal] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasCheckedNotifications, setHasCheckedNotifications] = useState(false);

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  const [currentNoteText, setCurrentNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // AI State
  const [aiChat, setAiChat] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const audioRef = useRef(new Audio());
  const sliderTimerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const pendingResumeTime = useRef(0);
  const chatContainerRef = useRef(null);

  const t = useMemo(() => STRINGS[lang] || STRINGS.en, [lang]);
  const currentNav = navStack[navStack.length - 1];

  // --- HELPER: Localized Text ---
  const getLocalized = (item, field) => {
    if (!item) return "";
    if (lang === 'hi' && item[`${field}_hi`]) {
        return String(item[`${field}_hi`]);
    }
    return String(item[field] || "");
  };

  // --- HELPER: Get YouTube ID (Strict & Clean) ---
  const getYoutubeId = (urlInput) => {
    if (!urlInput) return null;
    let url = urlInput;
    // Extract src from iframe tag if pasted
    if (urlInput.includes('<iframe')) {
        const srcMatch = urlInput.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) url = srcMatch[1];
    }
    // Regex for ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) return match[2];
    if (url.includes('shorts/')) return url.split('shorts/')[1]?.split('?')[0];
    return null;
  };

  // --- HELPER: Optimized URL (Thumbnails & Drive) ---
  const getOptimizedUrl = (url, type, item) => {
    if (!url) return "";
    // 1. YouTube Thumbnails
    if (type === 'video_thumb' || (item && item.type === 'video')) {
        const id = getYoutubeId(url);
        if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
    // 2. Drive Links
    if (url.includes('drive.google.com')) {
        const idMatch = url.match(/\/d\/(.*?)\/|id=(.*?)(&|$)/);
        const id = idMatch ? (idMatch[1] || idMatch[2]) : null;
        if (id) {
            if (type === 'image') return `https://drive.google.com/uc?export=view&id=${id}`;
            if (type === 'book') return `https://drive.google.com/file/d/${id}/preview`;
        }
    }
    return url;
  };

  // --- SPLASH SCREEN EFFECT ---
  useEffect(() => {
    const timer = setTimeout(() => { setShowSplash(false); }, 4000); 
    return () => clearTimeout(timer);
  }, []);

  // --- AUTO RESUME ---
  useEffect(() => {
    try {
        const savedTrack = localStorage.getItem('bcs_last_track');
        if (savedTrack) {
            const track = JSON.parse(savedTrack);
            setCurrentTrack(track);
            audioRef.current.src = track.url;
            const savedTime = localStorage.getItem('bcs_last_time');
            if (savedTime) {
                audioRef.current.currentTime = parseFloat(savedTime);
                pendingResumeTime.current = parseFloat(savedTime);
            }
        }
    } catch (e) { console.error("Error restoring session", e); }
  }, []);

  // --- AUTH & DATA ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) { try { await signInAnonymously(auth); } catch (e) {} }
      setUser(auth.currentUser);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub1 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'app_content'), (snap) => setContent(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsub2 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), (snap) => setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsub3 = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global'), (docSnap) => docSnap.exists() && setAppSettings(prev => ({ ...prev, ...docSnap.data() })));
    const unsub4 = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'progress'), (snap) => {
      const m = {}; snap.docs.forEach(d => m[d.id] = d.data()); setUserProgress(m);
    });
    const unsub5 = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'notes'), (snap) => {
      const m = {}; snap.docs.forEach(d => m[d.data().contentId] = d.data().text); setUserNotes(m);
    });
    const unsubLib = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'library'), (snap) => {
      const m = {}; snap.docs.forEach(d => m[d.id] = true); setUserLibrary(m);
    });
    const unsubFav = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'favorites'), (snap) => {
        const m = {}; snap.docs.forEach(d => m[d.id] = true); setUserFavorites(m);
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsubLib(); unsubFav(); };
  }, [user]);

  // --- HERO SLIDER ---
  useEffect(() => {
    const items = [];
    if (appSettings.heroImg1) items.push(1);
    if (items.length <= 1) return;
    sliderTimerRef.current = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % items.length);
    }, 4000); 
    return () => clearInterval(sliderTimerRef.current);
  }, [appSettings]);

  const heroItems = useMemo(() => {
    const items = [];
    if (appSettings.heroImg1) items.push({ imageUrl: appSettings.heroImg1, quote: appSettings.heroQuote1 || appSettings.quote1 });
    if (appSettings.heroImg2) items.push({ imageUrl: appSettings.heroImg2, quote: appSettings.heroQuote2 || appSettings.quote1 });
    if (appSettings.heroImg3) items.push({ imageUrl: appSettings.heroImg3, quote: appSettings.heroQuote3 || appSettings.quote1 });
    if (items.length === 0) return [{ imageUrl: appSettings.logoUrl, quote: appSettings.quote1 }];
    return items;
  }, [appSettings]);

  // --- ADVANCED GEMINI AI LOGIC (With Google Search) ---
  const handleAiSubmit = async (queryOverride = null) => {
    const query = queryOverride || aiInput;
    if (!query.trim()) return;
    
    // CRITICAL: Ensure we target the currently active item (Visual > Audio)
    const newItem = activeVisual || currentTrack;
    
    const contextTitle = getLocalized(newItem, 'title');
    // Prepare prompt with fallback to search
    const transcript = getLocalized(newItem, 'transcription') || newItem.description || getLocalized(newItem, 'lyricsText') || "No text available. Please use Google Search.";
    
    const userMsg = { role: 'user', text: query };
    setAiChat(prev => [...prev, userMsg]);
    setAiInput("");
    setIsAiLoading(true);
    setTimeout(() => chatContainerRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 100);

    try {
      const systemPrompt = `You are a spiritual assistant for HH Bhakti Charu Swami. 
      Context Title: "${contextTitle}".
      Content: """${transcript}"""
      
      Instructions:
      1. If the content is sufficient, answer based on it.
      2. If the content is missing or unrelated, use the 'google_search' tool to find the specific lecture/video details online.
      3. Provide a concise, spiritual answer.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            contents: [{ parts: [{ text: query }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            // ENABLE GOOGLE SEARCH GROUNDING
            tools: [{ google_search: {} }] 
        })
      });
      const data = await response.json();
      
      let aiText = "Sorry, I cannot answer right now.";
      if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
          aiText = data.candidates[0].content.parts.map(p => p.text).join("");
      }
      
      setAiChat(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("AI Error", error);
      setAiChat(prev => [...prev, { role: 'model', text: "Connection error. Please try again." }]);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => chatContainerRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 100);
    }
  };

  const copyToNotes = (text) => {
    const newNote = currentNoteText ? currentNoteText + "\n\n" + text : text;
    setCurrentNoteText(newNote);
    saveNote(newNote);
    alert("Saved to Notes!");
  };

  // --- AUDIO LOGIC ---
  const playTrack = (track) => {
    if (currentTrack?.id === track.id) { if (!isPlaying) togglePlay(); setIsPlayerOpen(true); return; }
    localStorage.setItem('bcs_last_track', JSON.stringify(track));
    setCurrentTrack(track); setDuration(0); setActiveModal(null); setAiChat([]);
    const savedPos = userProgress[track.id]?.lastTime || 0;
    pendingResumeTime.current = savedPos > 5 ? savedPos : 0;
    audioRef.current.src = track.url;
    audioRef.current.load();
    audioRef.current.play().catch(e => console.error(e));
    setIsPlaying(true); setIsPlayerOpen(true); setActiveVisual(null);
    if (user) setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'progress', track.id), { lastTime: 0, completed: false, updatedAt: new Date().toISOString() }, { merge: true });
  };

  const togglePlay = () => { if (isPlaying) audioRef.current.pause(); else audioRef.current.play().catch(e => console.error(e)); setIsPlaying(!isPlaying); };
  const handleStop = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } setIsPlaying(false); setProgress(0); setCurrentTime(0); };
  const handleDismiss = () => { handleStop(); setCurrentTrack(null); setIsPlayerOpen(false); setActiveModal(null); };
  const skipForward = (s = 30) => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + s); };
  const skipBackward = (s = 10) => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - s); };
  const handleSeek = (e) => { const val = parseFloat(e.target.value); if (!isNaN(val) && audioRef.current.duration) { audioRef.current.currentTime = (val / 100) * audioRef.current.duration; setProgress(val); } };
  const handleNext = () => { const list = content.filter(i => i.type === 'audio'); const idx = list.findIndex(t => t.id === currentTrack?.id); if (idx !== -1) playTrack(list[(idx + 1) % list.length]); };
  const handlePrev = () => { const list = content.filter(i => i.type === 'audio'); const idx = list.findIndex(t => t.id === currentTrack?.id); if (idx !== -1) playTrack(list[(idx - 1 + list.length) % list.length]); };

  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
      if(Math.floor(audio.currentTime) % 5 === 0) localStorage.setItem('bcs_last_time', audio.currentTime);
      if (user && currentTrack && Math.floor(audio.currentTime) % 5 === 0 && audio.currentTime > 5) {
         setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'progress', currentTrack.id), { lastTime: audio.currentTime, updatedAt: new Date().toISOString() }, { merge: true });
      }
    };
    const onMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration);
      if (pendingResumeTime.current > 0) { audio.currentTime = pendingResumeTime.current; pendingResumeTime.current = 0; }
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onMetadata);
    audio.addEventListener('durationchange', onMetadata);
    audio.addEventListener('ended', handleNext);
    return () => { audio.removeEventListener('timeupdate', onTimeUpdate); audio.removeEventListener('loadedmetadata', onMetadata); audio.removeEventListener('durationchange', onMetadata); audio.removeEventListener('ended', handleNext); };
  }, [currentTrack, user, duration]);

  const saveNote = async (textToSave = null) => {
    const activeId = currentTrack?.id || activeVisual?.id;
    const text = textToSave || currentNoteText;
    if (!user || !activeId || !text.trim()) return;
    setIsSaving(true);
    try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', activeId), { contentId: activeId, text: String(text), title: String(currentTrack?.title || activeVisual?.title), updatedAt: new Date().toISOString() }, { merge: true }); setTimeout(() => setIsSaving(false), 1500); } catch (e) { setIsSaving(false); }
  };

  useEffect(() => {
    const activeId = currentTrack?.id || activeVisual?.id;
    if (activeId && userNotes[activeId]) setCurrentNoteText(String(userNotes[activeId]));
    else setCurrentNoteText("");
  }, [currentTrack, activeVisual, userNotes]);

  const toggleFavorite = async (item) => {
      if(!user) return;
      if (userFavorites[item.id]) {
          await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', item.id));
      } else {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', item.id), { ...item, savedAt: new Date().toISOString() });
      }
  };

  const downloadToLibrary = async (item) => {
    if (!user || !item) return;
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'library', item.id), { ...item, downloadedAt: new Date().toISOString() });
      if (item.type === 'audio') {
          const link = document.createElement('a'); link.href = item.url; link.target = '_blank';
          link.setAttribute('download', (item.title || 'audio') + ".mp3");
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }
      alert("Added to Library!");
    } catch (e) { console.error(e); alert("Could not save."); } 
    finally { setIsDownloading(false); }
  };

  // --- FILTERING ---
  const availableFilters = useMemo(() => {
    const relevantItems = content.filter(i => {
       if (activeTab === 'audio') return i.type === 'audio';
       if (activeTab === 'videos') return i.type === 'video';
       if (activeTab === 'books') return i.type === 'book';
       return false;
    });
    const categories = new Set(relevantItems.map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(categories)];
  }, [content, activeTab]);

  useEffect(() => { setActiveFilter('All'); }, [activeTab]);

  const filteredContent = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const isSearching = term.length > 0;
    
    if (isSearching) {
        return content.filter(item => {
            const inTitle = (item.title || "").toLowerCase().includes(term);
            const inCat = (item.category || "").toLowerCase().includes(term);
            const inLyrics = (item.lyricsText || "").toLowerCase().includes(term);
            const inTranscription = (item.transcription || "").toLowerCase().includes(term);
            const inTranslation = (item.translationText || "").toLowerCase().includes(term);
            const inTitleHi = (item.title_hi || "").toLowerCase().includes(term);
            return inTitle || inCat || inLyrics || inTranscription || inTranslation || inTitleHi;
        });
    }

    return content.filter(item => {
      if (activeTab === 'dashboard') return false; 
      if (activeTab === 'gallery' && item.type !== 'image') return false;
      const matchesTab = (activeTab === 'audio' && item.type === 'audio') || (activeTab === 'videos' && item.type === 'video') || (activeTab === 'books' && item.type === 'book');
      if (!matchesTab) return false;
      const matchesFilter = activeFilter === 'All' || item.category === activeFilter;
      if (!matchesFilter) return false;
      return currentNav.id === 'root' || item.categoryId === currentNav.id;
    });
  }, [content, activeTab, currentNav, searchTerm, activeFilter]);

  const displayCategories = useMemo(() => categories.filter(c => {
    if (activeTab === 'gallery' || activeTab === 'dashboard') return false;
    const matchesTab = (activeTab === 'audio' && c.type === 'audio') || (activeTab === 'videos' && c.type === 'video') || (activeTab === 'books' && c.type === 'book');
    return matchesTab && c.parentId === currentNav.id;
  }), [categories, activeTab, currentNav]);

  const newArrivals = useMemo(() => content.filter(i => {
      return true; 
  }).slice(0, 5), [content]); 
  
  const latestAudio = useMemo(() => content.filter(i => i.type === 'audio').slice(0, 5), [content]);
  const latestVideo = useMemo(() => content.filter(i => i.type === 'video').slice(0, 5), [content]);
  const latestBooks = useMemo(() => content.filter(i => i.type === 'book').slice(0, 5), [content]);

  const continueLearningItems = useMemo(() => content.filter(item => {
    const prog = userProgress[item.id];
    return prog && prog.lastTime > 5 && !prog.completed;
  }).slice(0, 8), [content, userProgress]);

  const libraryItems = useMemo(() => content.filter(i => userLibrary[i.id]), [content, userLibrary]);
  const favoriteItems = useMemo(() => content.filter(i => userFavorites[i.id]), [content, userFavorites]);
  
  const pushNav = (cat) => setNavStack([...navStack, { name: cat.name, id: cat.id }]);

  // --- RENDER MODAL ---
  const renderFullScreenModal = () => {
    if (!activeModal) return null;
    
    // Determine which item is active (Video takes precedence)
    const item = activeVisual || currentTrack;
    
    if (!item) return null;
    const isCream = !isDarkMode;
    const textColor = isCream ? 'text-[#1A233A]' : 'text-white';
    const lyricsText = getLocalized(item, 'lyricsText');
    const translationText = getLocalized(item, 'translationText');
    const transcriptionText = getLocalized(item, 'transcription');

    return (
        <div className={`fixed inset-0 z-[2000] flex flex-col ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#FCFAF5]'} animate-in slide-in-from-bottom duration-300`}>
            <div className={`flex justify-between items-center px-6 py-4 border-b ${isDarkMode ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center space-x-2">
                   {activeModal === 'ai' && <Sparkles size={20} className="text-purple-500 animate-pulse" />}
                   <h3 className={`text-lg font-black uppercase tracking-widest ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`}>{t.tabs[activeModal]}</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-8" ref={chatContainerRef}>
                {activeModal === 'verse' && (
                    <div className="text-center pb-20">
                        {item.hasLyrics ? (
                             <div className="space-y-8">
                                <p className={`font-divine-serif italic whitespace-pre-wrap leading-loose ${textColor}`} style={{ fontSize: `${20 * fontScale}px` }}>{lyricsText}</p>
                                {item.hasTranslation && (<div className={`pt-8 border-t ${isCream ? 'border-orange-200' : 'border-white/10'}`}><span className="text-[10px] font-black uppercase text-orange-500 opacity-60 tracking-[0.3em] block mb-4">{t.translation}</span><p className={`font-divine-sans whitespace-pre-wrap leading-relaxed opacity-80 ${textColor}`} style={{ fontSize: `${16 * fontScale}px` }}>{translationText}</p></div>)}
                             </div>
                        ) : <div className="text-center opacity-40 mt-20 italic">No verse data available.</div>}
                    </div>
                )}
                {activeModal === 'transcript' && (
                    <div className="pb-20">
                         {transcriptionText ? (<p className={`font-divine-sans leading-loose text-justify whitespace-pre-wrap ${textColor}`} style={{ fontSize: `${16 * fontScale}px` }}>{transcriptionText}</p>) : <div className="text-center opacity-40 mt-20 italic">No transcript available.</div>}
                    </div>
                )}
                {activeModal === 'notes' && (
                    <div className="h-full flex flex-col pb-10">
                        <textarea value={currentNoteText} onChange={(e) => setCurrentNoteText(e.target.value)} placeholder={t.addNote} className={`flex-1 w-full p-4 rounded-xl text-lg resize-none outline-none mb-4 ${isCream ? 'bg-white text-slate-800 shadow-sm border border-gray-100' : 'bg-white/10 text-white'}`} />
                        <button onClick={() => saveNote()} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all ${isSaving ? 'bg-green-600' : 'bg-orange-600'} text-white shadow-xl`}>{isSaving ? <CheckCircle size={20}/> : <Save size={20}/>} <span>{isSaving ? "Saved" : t.saveNote}</span></button>
                    </div>
                )}
                {activeModal === 'ai' && (
                    <div className="pb-24 space-y-4">
                        {aiChat.length === 0 && (
                           <div className="text-center py-10 opacity-70">
                              <Sparkles size={48} className="mx-auto mb-4 text-purple-400 opacity-50" />
                              <p className={`text-sm italic mb-8 ${textColor}`}>{t.ai_welcome}</p>
                              <div className="flex flex-wrap justify-center gap-3">
                                 <button onClick={() => handleAiSubmit(t.quick_summary)} className="px-4 py-2 rounded-full border border-purple-300 text-purple-500 text-xs font-bold uppercase tracking-widest hover:bg-purple-50 transition-colors">{t.quick_summary}</button>
                                 <button onClick={() => handleAiSubmit(t.quick_meaning)} className="px-4 py-2 rounded-full border border-purple-300 text-purple-500 text-xs font-bold uppercase tracking-widest hover:bg-purple-50 transition-colors">{t.quick_meaning}</button>
                                 <button onClick={() => handleAiSubmit(t.quick_points)} className="px-4 py-2 rounded-full border border-purple-300 text-purple-500 text-xs font-bold uppercase tracking-widest hover:bg-purple-50 transition-colors">{t.quick_points}</button>
                              </div>
                           </div>
                        )}
                        {aiChat.map((msg, idx) => (
                           <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed relative group ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : (isDarkMode ? 'bg-white/10 text-white rounded-bl-none' : 'bg-white shadow-sm border border-gray-100 text-slate-800 rounded-bl-none')}`}>
                                 {msg.text}
                                 {msg.role === 'model' && (<button onClick={() => copyToNotes(msg.text)} className="absolute -bottom-6 right-0 p-1 text-xs text-gray-400 hover:text-orange-500 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12}/> <span>Save to Notes</span></button>)}
                              </div>
                           </div>
                        ))}
                        {isAiLoading && (<div className="flex justify-start animate-pulse"><div className={`p-4 rounded-2xl text-sm italic ${isDarkMode ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-500'}`}>{t.ai_thinking}</div></div>)}
                    </div>
                )}
            </div>
            {/* Input for AI */}
            {activeModal === 'ai' && (
               <div className={`px-4 py-4 border-t ${isDarkMode ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-white/10 rounded-full p-2 pr-2">
                     <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()} placeholder={t.ai_input_placeholder} className="flex-1 bg-transparent border-none outline-none px-4 text-sm dark:text-white" />
                     <button onClick={() => handleAiSubmit()} className={`p-3 rounded-full ${aiInput.trim() ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-300 text-gray-500'}`}><Send size={18} /></button>
                  </div>
               </div>
            )}
        </div>
    );
  };

  const themeClass = isDarkMode ? 'bg-slate-900 text-white' : 'bg-[#FCFAF5] text-slate-800';

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden transition-colors duration-500 ${themeClass}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@1,700;1,900&family=Poppins:wght@400;500;600;700;900&display=swap');
        .font-divine-serif{font-family:'Merriweather',serif;}
        .font-divine-sans{font-family:'Poppins',sans-serif;}
        .no-scrollbar::-webkit-scrollbar{display:none;}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
        @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { to { opacity: 0; visibility: hidden; } }
      `}</style>

      {/* --- CINEMATIC SPLASH SCREEN --- */}
      {showSplash && (
        <div className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-black transition-opacity duration-1000" style={{ animation: 'fadeOut 1s ease-in-out 3s forwards' }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/40 via-black to-black opacity-80"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-8 group">
                    <div className="absolute inset-0 rounded-full bg-orange-500 blur-xl opacity-20 animate-pulse"></div>
                    <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-orange-500/50 shadow-[0_0_40px_rgba(234,88,12,0.3)]" style={{ animation: 'zoomIn 1.5s ease-out' }}>
                        <img src={appSettings.logoUrl} className="w-full h-full object-cover scale-110" alt="Maharaj" />
                    </div>
                </div>
                <div className="text-center space-y-4 px-6">
                    <h1 className="text-3xl md:text-4xl text-white font-divine-serif italic font-bold tracking-wide" style={{ animation: 'slideUp 1s ease-out 0.5s both' }}>"Prabhupada Gata Prana"</h1>
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto" style={{ animation: 'fadeIn 1s ease-out 1s both' }}></div>
                    <p className="text-lg md:text-xl text-orange-200/90 font-light tracking-widest uppercase" style={{ animation: 'slideUp 1s ease-out 1.2s both' }}>HH Bhakti Charu Swami Maharaja</p>
                </div>
            </div>
        </div>
      )}

      {/* --- FIXED HEADER --- */}
      <div className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex justify-between items-center transition-all duration-500 bg-white/10 backdrop-blur-md border-b border-white/10 shadow-sm">
         <div className="flex items-center space-x-3 pointer-events-auto">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-md border border-white/30"><img src={appSettings.logoUrl} className="w-full h-full object-cover" alt="L" /></div>
            <span className={`text-[12px] font-black uppercase tracking-widest drop-shadow-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{String(appSettings.appName)}</span>
         </div>
         <div className="flex items-center space-x-2 pointer-events-auto">
            <button onClick={() => { setShowNotifications(!showNotifications); setHasCheckedNotifications(true); }} className="p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20 active:scale-90 transition-transform relative">
                <Bell size={18} className="text-slate-700 dark:text-white"/>
                {!hasCheckedNotifications && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20 active:scale-90 transition-transform">{isDarkMode ? <Sun size={18} className="text-orange-400"/> : <Moon size={18} className="text-slate-700"/>}</button>
            <button onClick={() => setShowProfile(true)} className="p-2 bg-orange-600 text-white rounded-full shadow-lg active:scale-90 transition-transform"><UserIcon size={18}/></button>
         </div>
      </div>

      {/* --- NOTIFICATIONS DROPDOWN --- */}
      {showNotifications && (
          <div className="fixed top-[70px] right-4 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-white/10 z-[150] p-4 animate-in slide-in-from-top-5">
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-slate-400">{t.notifications}</h3>
              <div className="space-y-3">
                  {newArrivals.slice(0, 3).map(i => (
                      <div key={i.id} onClick={() => { if(i.type==='audio') playTrack(i); else setActiveVisual(i); setShowNotifications(false); }} className="flex items-center space-x-3 cursor-pointer hover:opacity-70">
                          <img src={getOptimizedUrl(i.type==='video' ? i.url : i.imageUrl, 'image', i)} className="w-8 h-8 rounded-lg object-cover" alt=""/>
                          <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{getLocalized(i, 'title')}</p>
                              <p className="text-[9px] text-orange-500 uppercase font-bold">{t.new_arrival}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- CONTENT --- */}
      <main className="flex-1 overflow-y-auto pb-[200px] pt-[80px] scroll-smooth no-scrollbar">
        
        {/* HERO SECTION (Always visible) */}
        <div className="px-6 mb-10">
          <div className="relative group h-64 rounded-[45px] overflow-hidden shadow-2xl border-4 border-white/20 bg-black">
              <div className="absolute inset-0"><img src={heroItems[heroIndex]?.imageUrl || appSettings.logoUrl} className="w-full h-full object-cover blur-md opacity-60" /></div>
              <img src={heroItems[heroIndex]?.imageUrl || appSettings.logoUrl} className="absolute inset-0 w-full h-full object-contain z-10" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent p-8 flex flex-col justify-end z-20 pointer-events-none">
                  <div className="flex items-start space-x-3"><Quote size={16} className="text-orange-500 mt-1 flex-shrink-0" /><p className="text-white text-[13px] font-divine-serif italic leading-relaxed opacity-95 line-clamp-2">"{String(heroItems[heroIndex]?.quote || appSettings.quote1)}"</p></div>
              </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="px-6 mb-4 relative group">
           <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
           <input type="text" placeholder={t.search} className="w-full pl-14 pr-12 py-5 rounded-[30px] bg-white dark:bg-white/5 border-none shadow-sm text-sm font-bold focus:ring-4 focus:ring-orange-500/10 transition-all outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-slate-100 dark:bg-white/10 rounded-full text-slate-400 hover:text-orange-500 transition-colors"><X size={14} /></button>}
        </div>

        {/* --- DASHBOARD VIEW --- */}
        {activeTab === 'dashboard' && !searchTerm && (
            <div className="space-y-12 animate-in fade-in pb-20">
                {/* 1. Quick Links */}
                <div className="px-6 grid grid-cols-4 gap-4">
                    {[{id:'audio', i:Music, l:t.kirtan, c:'bg-orange-100 text-orange-600'}, {id:'videos', i:Tv, l:t.vani, c:'bg-blue-100 text-blue-600'}, {id:'books', i:BookOpen, l:t.seva, c:'bg-green-100 text-green-600'}, {id:'gallery', i:ImageIcon, l:t.gallery, c:'bg-purple-100 text-purple-600'}].map(x => (
                        <button key={x.id} onClick={() => setActiveTab(x.id)} className="flex flex-col items-center gap-2 group">
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-sm group-active:scale-90 transition-transform ${x.c} dark:bg-white/10 dark:text-white`}>
                                <x.i size={24}/>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{x.l}</span>
                        </button>
                    ))}
                </div>

                {/* 2. Latest Kirtans (Square Cards) */}
                <div className="pl-6 space-y-4">
                    <div className="flex justify-between items-center pr-6">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">{t.latest_audio}</h2>
                        <button onClick={() => setActiveTab('audio')} className="text-[10px] font-bold text-orange-600 flex items-center">{t.view_all} <ChevronRight size={12}/></button>
                    </div>
                    <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar pr-6">
                        {latestAudio.map(item => (
                            <div key={item.id} onClick={() => playTrack(item)} className="min-w-[120px] flex flex-col gap-2 cursor-pointer group">
                                <div className="w-full h-28 rounded-[24px] overflow-hidden relative shadow-md">
                                    <img src={getOptimizedUrl(item.imageUrl, 'image', item)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt=""/>
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play fill="white" className="text-white"/></div>
                                </div>
                                <h4 className="text-[10px] font-bold truncate px-1">{getLocalized(item, 'title')}</h4>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. New Videos (Compact Landscape) */}
                <div className="pl-6 space-y-4">
                    <div className="flex justify-between items-center pr-6">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">{t.latest_video}</h2>
                        <button onClick={() => setActiveTab('videos')} className="text-[10px] font-bold text-blue-600 flex items-center">{t.view_all} <ChevronRight size={12}/></button>
                    </div>
                    <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar pr-6">
                        {latestVideo.map(item => (
                            <div key={item.id} onClick={() => setActiveVisual(item)} className="min-w-[160px] flex flex-col gap-2 cursor-pointer group">
                                <div className="w-full h-24 rounded-[20px] overflow-hidden relative shadow-md">
                                    <img src={getOptimizedUrl(item.url, 'video_thumb', item)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt=""/>
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Film className="text-white"/></div>
                                </div>
                                <h4 className="text-[10px] font-bold truncate px-1">{getLocalized(item, 'title')}</h4>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Recent Books (Vertical) */}
                <div className="pl-6 space-y-4">
                    <div className="flex justify-between items-center pr-6">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">{t.latest_books}</h2>
                        <button onClick={() => setActiveTab('books')} className="text-[10px] font-bold text-green-600 flex items-center">{t.view_all} <ChevronRight size={12}/></button>
                    </div>
                    <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar pr-6">
                        {latestBooks.map(item => (
                            <div key={item.id} onClick={() => setActiveVisual(item)} className="min-w-[100px] flex flex-col gap-2 cursor-pointer group">
                                <div className="w-full h-36 rounded-[16px] overflow-hidden relative shadow-md border-l-4 border-l-white/20">
                                    <img src={getOptimizedUrl(item.imageUrl, 'image', item)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt=""/>
                                </div>
                                <h4 className="text-[10px] font-bold truncate px-1">{getLocalized(item, 'title')}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- STANDARD TABS (Audio, Video, Books) --- */}
        {activeTab !== 'dashboard' && (
            <>
                {/* FILTERS */}
                {activeTab !== 'gallery' && (
                  <div className="px-6 mb-8 flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                    {availableFilters.map(filter => (
                       <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${activeFilter === filter ? 'bg-orange-600 text-white shadow-lg scale-105' : (isDarkMode ? 'bg-white/10 text-slate-400 hover:bg-white/20' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50')}`}>{filter === 'All' ? t.filter_all : filter}</button>
                    ))}
                  </div>
                )}

                <div className="px-6 mt-6 space-y-10">
                  {continueLearningItems.length > 0 && activeTab !== 'gallery' && (
                    <div className="space-y-4 animate-in fade-in">
                       <h2 className="text-[11px] font-black uppercase tracking-[0.4em] px-2 text-slate-400 flex items-center"><History size={16} className="mr-3 text-orange-500"/> {t.continue}</h2>
                       <div className="flex space-x-5 overflow-x-auto pb-6 no-scrollbar px-1">
                          {continueLearningItems.map(item => (
                            <div key={item.id} onClick={() => { if(item.type==='audio') playTrack(item); else setActiveVisual(item); }} className="min-w-[180px] bg-white dark:bg-white/5 p-4 rounded-[40px] shadow-sm border border-slate-50 dark:border-white/5 flex-shrink-0 cursor-pointer active:scale-95 group transition-all hover:shadow-xl">
                               <div className="w-full h-36 rounded-[32px] overflow-hidden mb-4 relative bg-orange-50 shadow-inner">
                                  <img src={getOptimizedUrl(item.type==='video'?item.url:item.imageUrl, 'image', item)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20 backdrop-blur-sm"><div className="h-full bg-orange-500 shadow-[0_0_15px_#E67E22]" style={{ width: `${Math.min(100, (userProgress[item.id]?.lastTime / 300) * 100)}%` }}></div></div>
                               </div>
                               <h4 className="text-[12px] font-black truncate px-2 text-center uppercase tracking-tighter opacity-80">{getLocalized(item, 'title')}</h4>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {displayCategories.length > 0 && !searchTerm && (
                    <div className="space-y-6">
                      <h2 className="text-[11px] font-black uppercase tracking-[0.4em] px-2 text-slate-400 flex items-center"><Grid className="mr-3 text-orange-500" size={18} /> {t.categories}</h2>
                      <div className="grid grid-cols-2 gap-6 pb-4">
                        {displayCategories.map((cat) => (
                          <div key={cat.id} className="relative h-44 rounded-[45px] overflow-hidden shadow-lg border-4 border-white dark:border-white/5 cursor-pointer bg-white dark:bg-white/5 group active:scale-95 transition-all" onClick={() => pushNav(cat)}>
                            {cat.imageUrl && cat.imageUrl !== 'no-image' ? <img src={getOptimizedUrl(cat.imageUrl, 'image')} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform" alt={cat.name} /> : <div className="absolute inset-0 flex items-center justify-center bg-orange-50/50"><Folder className="text-orange-200" size={40} /></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-8">
                              <span className="text-white font-black text-[14px] leading-tight drop-shadow-md uppercase tracking-tight">{String(cat.name)}</span>
                              <div className="h-1 w-8 bg-orange-500 mt-3 rounded-full"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-6 pb-20">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] px-2 text-slate-400">{t.sacredItems}</h2>
                    {/* --- 4-COLUMN GRID LAYOUT --- */}
                    <div className="grid grid-cols-4 gap-3">
                      {filteredContent.map(item => (
                        <div key={item.id} onClick={() => { if (item.type === 'audio') playTrack(item); else if (item.type === 'video' || item.type === 'book' || item.type === 'image') setActiveVisual(item); else window.open(String(item.url), '_blank'); }} className="bg-white dark:bg-white/5 p-2 rounded-[20px] shadow-sm flex flex-col gap-2 border border-slate-50 dark:border-white/5 cursor-pointer hover:shadow-xl active:bg-orange-50 transition-all relative group">
                          {/* Image Top - CONDITIONAL ASPECT RATIO */}
                          <div className={`w-full ${item.type === 'video' ? 'aspect-video' : 'aspect-square'} rounded-[16px] overflow-hidden bg-orange-50 flex-shrink-0 relative shadow-inner`}>
                            {/* Force Video Thumbnail from YouTube URL */}
                            <img src={getOptimizedUrl(item.type === 'video' ? item.url : item.imageUrl, 'image', item)} className="w-full h-full object-cover" alt="" />
                            {userProgress[item.id] && (<div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10"><div className="h-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" style={{ width: `${Math.min(100, (userProgress[item.id]?.lastTime / 300) * 100)}%` }}></div></div>)}
                            <div className="absolute top-1 right-1 p-1 bg-white/30 backdrop-blur-md rounded-full text-white">
                                {item.type === 'audio' ? <Play size={8} fill="currentColor" /> : item.type === 'video' ? <Film size={8} /> : <BookOpen size={8} />}
                            </div>
                          </div>
                          {/* Text Bottom */}
                          <div className="flex-1 min-w-0 px-0.5">
                            <h3 className="font-bold text-[9px] leading-tight line-clamp-2 opacity-90 mb-1">{getLocalized(item, 'title')}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-[6px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 dark:bg-white/10 px-1.5 py-0.5 rounded-full truncate max-w-[60px]">{String(item.category)}</span>
                              <button onClick={(e) => {e.stopPropagation(); toggleFavorite(item)}} className="text-gray-300 hover:text-red-500 transition-colors">
                                  <Heart size={10} fill={userFavorites[item.id] ? "currentColor" : "none"} className={userFavorites[item.id] ? "text-red-500" : ""}/>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </>
        )}
      </main>

      {/* --- PROFILE DRAWER (Fixed Z-Index) --- */}
      {showProfile && (
        <div className="fixed inset-0 z-[2500] bg-black/60 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#FCFAF5] dark:bg-slate-900 shadow-2xl p-10 flex flex-col animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-center mb-12">
                 <h2 className="text-xl font-black uppercase tracking-widest text-orange-600">Devotee Suite</h2>
                 <button onClick={() => setShowProfile(false)} className="p-3 bg-white dark:bg-white/10 rounded-2xl shadow-sm"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar">
                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{t.favorites} & {t.library}</h3>
                    {(Object.keys(userFavorites).length > 0 || libraryItems.length > 0) ? (
                      <div className="space-y-3">
                          {[...new Map([...libraryItems, ...favoriteItems].map(item => [item.id, item])).values()].map(i => (
                            <div key={i.id} onClick={() => { if(i.type==='audio') playTrack(i); else setActiveVisual(i); setShowProfile(false); }} className="p-4 bg-white dark:bg-white/5 rounded-3xl flex items-center space-x-4 border border-slate-50 dark:border-white/5 active:scale-95">
                               <img src={getOptimizedUrl(i.type==='video'?i.url:i.imageUrl, 'image', i)} className="w-10 h-10 rounded-xl object-cover" alt="" />
                               <div className="flex-1 min-w-0">
                                 <span className="text-xs font-bold truncate block">{getLocalized(i, 'title')}</span>
                                 <span className="text-[9px] opacity-50 uppercase tracking-widest block">{userLibrary[i.id] ? "Downloaded" : "Favorite"}</span>
                               </div>
                               {userFavorites[i.id] && <Heart size={14} className="text-red-500 fill-current"/>}
                            </div>
                          ))}
                      </div>
                    ) : <p className="text-xs opacity-40 italic text-center py-10">No favorites or downloads yet.</p>}
                 </div>
                 <button onClick={() => { setLang(lang==='en'?'hi':'en'); setShowProfile(false); }} className="w-full p-6 bg-white dark:bg-white/5 rounded-[32px] flex items-center justify-between shadow-sm active:scale-95 transition-all"><div className="flex items-center space-x-4"><Globe className="text-orange-500"/><span className="font-bold text-sm uppercase tracking-widest">{t.language}</span></div></button>
                 <div className="p-8 bg-white dark:bg-white/5 rounded-[40px] space-y-4 shadow-inner">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{t.about}</h3>
                    <p className="text-sm leading-relaxed opacity-70 italic">{String(appSettings.aboutText)}</p>
                    <button onClick={() => window.open(String(appSettings.contactLink), '_blank')} className="w-full py-5 bg-orange-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 active:scale-95 transition-all"><Phone size={18}/> <span>{t.contact}</span></button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MINI PLAYER --- */}
      {currentTrack && !isPlayerOpen && (
        <div onClick={() => setIsPlayerOpen(true)} className="fixed bottom-[115px] left-5 right-5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-3xl p-5 rounded-[45px] shadow-[0_30px_100px_rgba(0,0,0,0.4)] flex items-center z-40 border border-white/40 dark:border-white/10 animate-in slide-in-from-bottom-10">
          <img src={getOptimizedUrl(currentTrack.imageUrl, 'image', currentTrack)} className="w-14 h-14 rounded-[28px] object-cover mr-4 shadow-xl border-2 border-white" alt="" />
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-black truncate italic leading-tight uppercase tracking-tighter opacity-90">{getLocalized(currentTrack, 'title')}</h4>
            <div className="flex items-center space-x-2 mt-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <span className="text-[9px] text-orange-600 font-black uppercase tracking-[0.2em]">{isPlaying ? 'Hearing Nectar' : 'Paused'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-12 h-12 bg-orange-600 text-white rounded-[20px] flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} className="ml-1" fill="white" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDismiss(); }} className="w-12 h-12 bg-slate-100 dark:bg-white/10 text-slate-400 rounded-[20px] flex items-center justify-center active:scale-90 transition-transform"><X size={20} /></button>
          </div>
        </div>
      )}

      {/* --- FULL PLAYER --- */}
      {isPlayerOpen && (
        <div className={`fixed inset-0 z-[300] flex flex-col pt-8 animate-in slide-in-from-bottom duration-500 font-divine-sans ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#F9F5F0]'}`}>
          <div className="px-8 flex justify-between items-center mb-6 flex-shrink-0">
             <button onClick={() => setIsPlayerOpen(false)} className={`p-3 rounded-full transition-transform active:scale-90 ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-[#1A233A] shadow-sm'}`}><ChevronDown size={24} /></button>
             <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Now Playing</div>
             <div className="flex items-center gap-3">
                 <button onClick={() => toggleFavorite(currentTrack)} className={`p-3 rounded-full transition-transform active:scale-90 ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-[#1A233A] shadow-sm'}`}>
                    <Heart size={20} className={userFavorites[currentTrack.id] ? "text-red-500 fill-current" : ""}/>
                 </button>
                 <button onClick={() => downloadToLibrary(currentTrack)} className={`p-3 rounded-full transition-transform active:scale-90 ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-[#1A233A] shadow-sm'}`} disabled={isDownloading}>{isDownloading ? <Loader2 size={20} className="animate-spin" /> : <DownloadCloud size={20} />}</button>
             </div>
          </div>

          <div className="flex-1 flex flex-col w-full max-w-md mx-auto relative z-10 overflow-y-auto px-6">
              <div className="flex-shrink-0 flex flex-col items-center w-full">
                  <div className="w-64 h-64 rounded-[40px] overflow-hidden shadow-2xl bg-white mb-8 border-4 border-white dark:border-white/10">
                     <img src={getOptimizedUrl(currentTrack?.imageUrl, 'image', currentTrack)} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="text-center mb-8">
                     <h1 className={`font-divine-serif italic text-2xl font-bold leading-tight line-clamp-2 mb-2 ${isDarkMode ? 'text-white' : 'text-[#1A233A]'}`}>{getLocalized(currentTrack, 'title')}</h1>
                     <p className="text-[#E67E22] text-xs font-bold uppercase tracking-widest">{String(currentTrack?.category || "Divine Audio")}</p>
                  </div>
              </div>

              <div className="w-full mb-8">
                 <div className="flex justify-between text-[10px] font-bold text-[#E67E22] mb-2 px-1"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
                 <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-[#E67E22] mb-8" />
                 <div className="flex items-center justify-between">
                     <button onClick={() => skipBackward(10)} className={`p-3 rounded-full ${isDarkMode ? 'text-gray-400' : 'text-slate-400 hover:bg-white'}`}><RotateCcw size={24} /></button>
                     <button onClick={handlePrev} className={`p-4 rounded-full ${isDarkMode ? 'text-white' : 'text-[#1A233A] hover:bg-white'}`}><SkipBack size={32} fill="currentColor" /></button>
                     <button onClick={togglePlay} className={`w-20 h-20 rounded-[30px] flex items-center justify-center shadow-xl active:scale-95 transition-transform ${isDarkMode ? 'bg-white text-black' : 'bg-[#1A233A] text-white'}`}>{isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1"/>}</button>
                     <button onClick={handleNext} className={`p-4 rounded-full ${isDarkMode ? 'text-white' : 'text-[#1A233A] hover:bg-white'}`}><SkipForward size={32} fill="currentColor" /></button>
                     <button onClick={() => skipForward(30)} className={`p-3 rounded-full ${isDarkMode ? 'text-gray-400' : 'text-slate-400 hover:bg-white'}`}><RotateCw size={24} /></button>
                 </div>
              </div>

              {/* ACTION BUTTONS: GRID 2x2 */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                 <button onClick={() => setActiveModal('verse')} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white shadow-sm border border-slate-100'}`}>
                    <BookOpen size={24} className="mb-2 text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.tabs.verse}</span>
                 </button>
                 <button onClick={() => setActiveModal('transcript')} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white shadow-sm border border-slate-100'}`}>
                    <AlignLeft size={24} className="mb-2 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.tabs.transcript}</span>
                 </button>
                 <button onClick={() => setActiveModal('notes')} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white shadow-sm border border-slate-100'}`}>
                    <Edit3 size={24} className="mb-2 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.tabs.notes}</span>
                 </button>
                 <button onClick={() => setActiveModal('ai')} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all relative overflow-hidden ${isDarkMode ? 'bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30' : 'bg-purple-50 shadow-sm border border-purple-100 hover:bg-purple-100'}`}>
                    <Sparkles size={24} className="mb-2 text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-300">{t.tabs.ai}</span>
                 </button>
              </div>
          </div>
        </div>
      )}

      {/* --- FULL SCREEN OVERLAY RENDER --- */}
      {renderFullScreenModal()}

      {/* --- VISUAL MEDIA PLAYER (Video & Books) --- */}
      {activeVisual && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="flex-shrink-0 w-full bg-black relative shadow-2xl z-20 flex flex-col h-full">
            <div className="relative flex-1">
                {activeVisual.type === 'image' ? (
                    <img src={getOptimizedUrl(activeVisual.url, 'image', activeVisual)} className="w-full h-full object-contain" alt="" />
                ) : activeVisual.type === 'book' ? (
                    /* BOOK READER (Robust Drive Embed) */
                    <iframe 
                        src={getOptimizedUrl(activeVisual.url, 'book') || `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(activeVisual.url)}`}
                        className="w-full h-full border-none bg-white"
                        title="Book Reader"
                    />
                ) : (
                    /* VIDEO PLAYER (Fixed Error 153 using Embed Code Standard) */
                    <div className="relative w-full pb-[56.25%] h-0 overflow-hidden bg-black">
                        <iframe 
                            src={`https://www.youtube.com/embed/${getYoutubeId(activeVisual.url)}?autoplay=1&modestbranding=1&rel=0`} 
                            title={activeVisual.title}
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full border-0"
                        />
                    </div>
                )}
                
                {/* Floating Controls */}
                <button onClick={() => setActiveVisual(null)} className="absolute top-5 right-5 p-3 bg-black/60 text-white rounded-full active:scale-90 transition-transform shadow-xl border border-white/10 z-50"><X size={24} /></button>
                <button onClick={() => toggleFavorite(activeVisual)} className="absolute top-5 right-20 p-3 bg-black/60 text-white rounded-full active:scale-90 transition-transform shadow-xl border border-white/10 z-50">
                    <Heart size={20} className={userFavorites[activeVisual.id] ? "text-red-500 fill-current" : ""}/>
                </button>
            </div>

            {/* Bottom Details Panel (Collapsible if needed, simpler here) */}
            <div className="flex-shrink-0 bg-[#0a0a0a] p-6 max-h-[40vh] overflow-y-auto">
                <h2 className="text-white text-xl font-bold mb-4">{getLocalized(activeVisual, 'title')}</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <button onClick={() => setActiveModal('verse')} className="bg-white/10 p-3 rounded-xl text-white text-xs font-bold uppercase">Verse</button>
                    <button onClick={() => setActiveModal('transcript')} className="bg-white/10 p-3 rounded-xl text-white text-xs font-bold uppercase">Text</button>
                    <button onClick={() => setActiveModal('notes')} className="bg-white/10 p-3 rounded-xl text-white text-xs font-bold uppercase">Notes</button>
                    <button onClick={() => setActiveModal('ai')} className="bg-purple-900/30 border border-purple-500/30 p-3 rounded-xl text-purple-300 text-xs font-bold uppercase flex items-center justify-center gap-2"><Sparkles size={14}/> Ask AI</button>
                </div>
                <p className="text-gray-400 text-sm italic">{activeVisual.description || "No description available."}</p>
            </div>
          </div>
        </div>
      )}

      {/* --- BOTTOM NAVIGATION --- */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl flex justify-around items-center border-t border-slate-100 dark:border-white/5 rounded-t-[55px] z-50 transition-all duration-500 ${currentTrack ? 'h-[105px] pt-4 pb-6 shadow-[0_-20px_100px_rgba(0,0,0,0.1)]' : 'h-[100px] pb-4 pt-2 shadow-[0_-20px_80px_rgba(0,0,0,0.06)]'}`}>
        {[
            { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
            { id: 'audio', icon: Music, label: t.kirtan }, 
            { id: 'videos', icon: Tv, label: t.vani }, 
            { id: 'books', icon: BookOpen, label: t.seva }, 
            { id: 'gallery', icon: ImageIcon, label: t.gallery }
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setNavStack([{ name: 'Home', id: 'root' }]); }} className={`flex flex-col items-center justify-center w-full h-full transition-all ${activeTab === tab.id ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}>
            <div className={`transition-all duration-300 flex flex-col items-center ${activeTab === tab.id ? '-translate-y-2' : ''}`}>
               <div className={`transition-all duration-300 ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-xl scale-110 p-3 rounded-2xl mb-1' : 'p-1'}`}>
                  <tab.icon size={activeTab === tab.id ? 20 : 24} strokeWidth={activeTab === tab.id ? 3 : 2} />
               </div>
               <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${activeTab === tab.id ? 'opacity-100 text-orange-600' : 'opacity-0 h-0 overflow-hidden'}`}>{String(tab.label)}</span>
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}