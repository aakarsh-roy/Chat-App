import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaPause, FaPlay, FaTimes, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function VoiceRecorder({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Use webm codec for better compatibility
      const options = { mimeType: 'audio/webm' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      onSend(file);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    // Start recording automatically when component mounts
    startRecording();
  }, []);

  return (
    <div className="flex items-center space-x-2 bg-primary-50 dark:bg-gray-700 p-3 rounded-lg animate-fadeIn">
      {!audioBlob ? (
        <>
          {/* Recording Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={stopRecording}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition shadow-lg"
              title="Stop recording"
            >
              <FaStop className="text-lg" />
            </button>
            
            {!isPaused ? (
              <button
                onClick={pauseRecording}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition"
                title="Pause recording"
              >
                <FaPause className="text-gray-600 dark:text-gray-300" />
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition"
                title="Resume recording"
              >
                <FaPlay className="text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
          
          {/* Recording Indicator */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                {isRecording && !isPaused && (
                  <div className="h-full bg-red-500 animate-pulse w-full"></div>
                )}
              </div>
              <span className="text-sm font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {formatTime(duration)}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isPaused ? 'Paused' : 'Recording...'}
            </p>
          </div>

          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition"
            title="Cancel recording"
          >
            <FaTimes className="text-gray-600 dark:text-gray-300" />
          </button>
        </>
      ) : (
        <>
          {/* Audio Preview */}
          <button
            onClick={togglePlayPause}
            className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <FaPause className="text-lg" /> : <FaPlay className="text-lg" />}
          </button>

          <audio
            ref={audioRef}
            src={audioBlob ? URL.createObjectURL(audioBlob) : ''}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                <div className="h-full bg-primary-600 rounded-full w-full"></div>
              </div>
              <span className="text-sm font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {formatTime(duration)}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Voice message ready
            </p>
          </div>
          
          <button
            onClick={handleSend}
            className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-full transition shadow-lg"
            title="Send voice message"
          >
            <FaPaperPlane className="text-lg" />
          </button>
          
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition"
            title="Cancel"
          >
            <FaTimes className="text-gray-600 dark:text-gray-300" />
          </button>
        </>
      )}
    </div>
  );
}
