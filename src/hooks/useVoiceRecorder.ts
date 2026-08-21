import { useState, useRef } from 'react';

const COLORS = ["side-glow-rose", "side-glow-purple", "side-glow-orange", "side-glow-blue", "side-glow-yellow", "side-glow-cyan", "side-glow-cyan-right", "side-glow-magenta"];

export function useVoiceRecorder(onRecordFinished?: (minutes: number) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const audioChunks = useRef<Blob[]>([]);
  const transcriptRef = useRef("");
  const bookmarksRef = useRef<number[]>([]);
  const recordingStartTime = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const shouldRecognizeRef = useRef(false);
  
  const [notes, setNotes] = useState([
    { id: 1, title: "Lecture 1 Summary", time: "10:00 AM • 45m", color: "side-glow-cyan-right", audioUrl: null as string | null, transcript: "This is a mock transcript from a previous class. The professor mentioned that the midterm will cover chapters 1 through 4...", bookmarks: [120, 450] },
    { id: 2, title: "Study Group Sync", time: "Yesterday", color: "side-glow-orange", audioUrl: null, transcript: "Mock transcript...", bookmarks: [] },
    { id: 3, title: "Ideas Draft", time: "Mon • 5m", color: "side-glow-rose", audioUrl: null, transcript: "Mock transcript...", bookmarks: [15] }
  ]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        shouldRecognizeRef.current = true;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        let finalTranscriptStr = '';
        recognition.onresult = (e: any) => {
          let interimTranscript = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
              finalTranscriptStr += e.results[i][0].transcript + ' ';
            } else {
              interimTranscript += e.results[i][0].transcript + ' ';
            }
          }
          transcriptRef.current = finalTranscriptStr + interimTranscript;
        };
        recognition.onerror = (e: any) => {
          console.error("Speech recognition error:", e.error);
          if (e.error !== 'no-speech') {
            transcriptRef.current = `[Speech recognition failed: ${e.error}]`;
          }
        };
        recognition.onend = () => {
          if (shouldRecognizeRef.current) {
            try {
              recognition.start();
            } catch (err) {
              console.error("Failed to restart recognition", err);
            }
          }
        };
        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (e) {}
      } else {
        console.warn("SpeechRecognition not supported in this browser.");
      }
      
      recorder.onstop = () => {
        shouldRecognizeRef.current = false;
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        
        const durationMinutes = Math.max(1, Math.round((Date.now() - recordingStartTime.current) / 60000));
        
        setNotes(prev => [
          { 
            id: Date.now(), 
            title: "New Voice Note", 
            time: `${timeStr} • ${durationMinutes}m`, 
            color: randomColor, 
            audioUrl: url,
            transcript: transcriptRef.current,
            bookmarks: [...bookmarksRef.current]
          },
          ...prev
        ]);
        
        if (onRecordFinished) {
          onRecordFinished(durationMinutes);
        }
        
        audioChunks.current = [];
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
        }
      };

      recordingStartTime.current = Date.now();
      transcriptRef.current = "";
      bookmarksRef.current = [];
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error", err);
      alert("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    shouldRecognizeRef.current = false;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const addBookmark = () => {
    const elapsed = Math.floor((Date.now() - recordingStartTime.current) / 1000);
    bookmarksRef.current.push(elapsed);
  };

  return {
    isRecording,
    toggleRecording,
    addBookmark,
    notes,
    setNotes,
    recordingStartTime
  };
}
