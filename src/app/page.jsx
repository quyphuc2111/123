"use client";

if (typeof window !== "undefined") {
  window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || {};
}

import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [isVoiceReady, setIsVoiceReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState("This library is awesome!");
  const [utterance] = useState(() => {
    if (typeof window !== "undefined") {
      return new SpeechSynthesisUtterance(text);
    }
    return null;
  });
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState([]);
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [highlightMode, setHighlightMode] = useState("word");
  const [highlightColor, setHighlightColor] = useState("#FFEB3B");
  const menuRef = useRef(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");

  // Tải danh sách giọng nói
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis
          .getVoices()
          .filter((voice) => voice.lang === selectedLanguage);
        setVoices(availableVoices);

        console.log("first", window.speechSynthesis
          .getVoices())

        if (availableVoices.length > 0) {
          setIsVoiceReady(true);
          setSelectedVoice(availableVoices[0]);
          utterance.voice = availableVoices[0];
        }
      }
    };

    if (typeof window !== "undefined" && window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedLanguage, utterance]);

  // Thiết lập utterance
  useEffect(() => {
    utterance.onstart = () => {
      console.log("Speech started");
      setIsPlaying(true);
      if (isHighlightEnabled) {
        setCurrentWordIndex(0);
      }
    };
  
    utterance.onend = () => {
      console.log("Speech ended");
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };
  
    utterance.onboundary = (event) => {
      console.log("Boundary event:", event);
  
      if (!isHighlightEnabled) return;
  
      if (highlightMode === "word" && event.name === "word") {
        const upToIndex = event.charIndex;
        const wordIndex = text.substring(0, upToIndex).split(" ").length - 1;
        setCurrentWordIndex(wordIndex);
      } else if (highlightMode === "sentence" && event.name === "sentence") {
        const upToIndex = event.charIndex;
        const textUpTo = text.substring(0, upToIndex);
        const sentenceIndex = (textUpTo.match(/[.!?]+/g) || []).length;
        setCurrentWordIndex(sentenceIndex);
      }
    };
  
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = selectedLanguage;
  
    return () => {
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onboundary = null;
    };
  }, [utterance, rate, pitch, text, isHighlightEnabled, highlightMode, selectedLanguage]);
  

  // Cập nhật utterance và words khi text thay đổi
  useEffect(() => {
    if (highlightMode === "word") {
      setWords(text.split(" "));
    } else {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      setWords(sentences);
    }
    utterance.text = text;

    // Reset highlight
    setCurrentWordIndex(-1);
  }, [text, highlightMode, utterance]);

  const handleVoiceChange = (event) => {
    const voice = voices[event.target.value];
    setSelectedVoice(voice);
    utterance.voice = voice;

    // Reset trạng thái highlight
    setCurrentWordIndex(-1);

    // Dừng phát nếu đang phát
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleRateChange = (event) => {
    const newRate = parseFloat(event.target.value);
    setRate(newRate);
    utterance.rate = newRate;
  };

  const handlePitchChange = (event) => {
    const newPitch = parseFloat(event.target.value);
    setPitch(newPitch);
    utterance.pitch = newPitch;
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  const handleHighlightToggle = (event) => {
    setIsHighlightEnabled(event.target.checked);
    if (!event.target.checked) {
      setCurrentWordIndex(-1);
    }
  };

  const handleStart = () => {
    // if (
    //   !("speechSynthesis" in window && "SpeechSynthesisUtterance" in window)
    // ) {
    //   alert(
    //     "Trình duyệt của bạn không hỗ trợ. Vui lòng sử dụng Chrome, Edge hoặc Cốc Cốc."
    //   );
    //   return;
    // }

    // if (!window.chrome) {
    //   alert(
    //     "Vui lòng sử dụng trình duyệt dựa trên Chromium (Chrome, Edge, Cốc Cốc) để có trải nghiệm tốt nhất"
    //   );
    //   return;
    // }

    if (isVoiceReady && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    } else {
      alert("Giọng nói chưa sẵn sàng. Vui lòng thử lại.");
    }


  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  };

  const handleClear = () => {
    setText("");
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
  
    // Tải giọng đọc cho ngôn ngữ mới
    const newVoice = voices.find((voice) => voice.lang === newLanguage) || null;
  
    if (newVoice) {
      utterance.lang = newLanguage;
      utterance.voice = newVoice;
      setSelectedVoice(newVoice);
    }
  
    // Reset trạng thái highlight
    setCurrentWordIndex(-1);
  
    // Dừng phát nếu đang phát
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-[100px] overflow-hidden">
            <img
              src="/logo_bkt.webp"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleStart}
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <button
            onClick={handleStop}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            {showMenu ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-8">
        <div className="relative">
          <textarea
            value={text}
            onChange={handleTextChange}
            className="w-full p-4 rounded-lg border bg-white border-gray-200 min-h-[200px] mb-4"
            placeholder="Nhập văn bản cần đọc..."
          />

          {text && (
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
              title="Xóa văn bản"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="p-6 rounded-lg bg-gray-50">
          {words.map((word, index) => (
            <span
              key={index}
              className="transition-colors"
              style={{
                backgroundColor:
                  isHighlightEnabled && index === currentWordIndex
                    ? highlightColor
                    : "transparent",
              }}
            >
              {word}
              {highlightMode === "word" ? " " : ""}
            </span>
          ))}
        </div>
      </main>

      {/* Menu Popup */}
      {showMenu && (
        <div
          ref={menuRef}
          className="fixed top-16 right-4 bg-white shadow-lg rounded-lg p-4 w-80"
        >
          <div className="space-y-4">
            {/* Language Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Chọn ngôn ngữ:</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedLanguage}
                onChange={handleLanguageChange}
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
              </select>
            </div>
            {/* Voice Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Chọn giọng đọc:</label>
              <select
                className="w-full p-2 border rounded"
                onChange={handleVoiceChange}
                value={voices.indexOf(selectedVoice)}
              >
                {voices.map((voice, index) => (
                  <option key={index} value={index}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rate Control */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Tốc độ đọc: {rate}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={handleRateChange}
                className="w-full"
              />
            </div>

            {/* Pitch Control */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Cao độ: {pitch}</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={handlePitchChange}
                className="w-full"
              />
            </div>

            {/* Highlight Mode Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Chế độ highlight:</label>
              <select
                className="w-full p-2 border rounded"
                value={highlightMode}
                onChange={(e) => setHighlightMode(e.target.value)}
              >
                <option value="word">Theo từ</option>
                <option value="sentence">Theo câu</option>
              </select>
            </div>

            {/* Color Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Màu highlight:</label>
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="w-full h-10"
              />
            </div>

            {/* Highlight Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isHighlightEnabled}
                onChange={handleHighlightToggle}
                id="highlight-toggle"
              />
              <label htmlFor="highlight-toggle" className="text-sm font-medium">
                Bật highlight từ
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
