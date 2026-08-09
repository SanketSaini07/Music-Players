import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Menu, Volume2, VolumeX } from 'lucide-react';
import './App.css';

// Jamendo API test client ID
const JAMENDO_CLIENT_ID = '709fa152';

export default function App() {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const audioRef = useRef(new Audio());

  // Fetch Music Data
  useEffect(() => {
    fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=15&order=popularity_week`)
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const tracks = data.results.map((track) => ({
            id: track.id,
            title: track.name,
            artist: track.artist_name,
            file: track.audio,
            icon: track.album_image || track.image || 'https://via.placeholder.com/175'
          }));
          setPlaylist(tracks);
        }
      })
      .catch((err) => console.error('Fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const currentTrack = playlist[currentIndex] || null;

  // Track event listeners
  useEffect(() => {
    const audio = audioRef.current;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, playlist, isRepeat, isShuffle]);

  // Handle Track Selection Changes
  useEffect(() => {
    if (currentTrack) {
      audioRef.current.src = currentTrack.file;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentIndex, playlist]);

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    if (isRepeat) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      setCurrentIndex(randomIndex);
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleSeek = (e) => {
    const targetTime = Number(e.target.value);
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const toggleMute = () => {
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="preloader">
        <div className="spinner">Loading player...</div>
      </div>
    );
  }

  return (
    <div className="player-wrapper">
      <div className="player-body">
        {/* Header */}
        <div className="player-header">
          <div className="header-title">
            {isPlaying ? 'NOW PLAYING' : 'PAUSED...'}
          </div>
          <button className="icon-btn" onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}>
            <Menu size={18} />
          </button>
        </div>

        {/* Track Artwork */}
        <div className="album-wrap">
          <img src={currentTrack?.icon} alt={currentTrack?.title} className="album-art" />
        </div>

        {/* Track Metadata */}
        <div className="song-playing">
          <div className="song-name">{currentTrack?.title || 'No Track Selected'}</div>
          <div className="artist-name">{currentTrack?.artist || 'Unknown Artist'}</div>
        </div>

        {/* Timeline */}
        <div className="timeline-wrap">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="progress-bar"
          />
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="player-btns">
          <button className={`icon-btn ${isShuffle ? 'active' : ''}`} onClick={() => setIsShuffle(!isShuffle)}>
            <Shuffle size={18} />
          </button>
          <button className="icon-btn" onClick={handlePrev}>
            <SkipBack size={20} />
          </button>
          <button className="play-btn" onClick={togglePlay}>
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button className="icon-btn" onClick={handleNext}>
            <SkipForward size={20} />
          </button>
          <button className={`icon-btn ${isRepeat ? 'active' : ''}`} onClick={() => setIsRepeat(!isRepeat)}>
            <Repeat size={18} />
          </button>
          <button className="icon-btn mute-btn" onClick={toggleMute}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Drawer Menu */}
        <div className={`playlist-drawer ${isPlaylistOpen ? 'open' : ''}`}>
          <div className="playlist-header">Queue ({playlist.length})</div>
          <ul>
            {playlist.map((track, idx) => (
              <li
                key={track.id}
                className={`playlist-item ${idx === currentIndex ? 'active-track' : ''}`}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsPlaying(true);
                }}
              >
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.artist}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}