import { VoiceRecognitionStatus } from '../types';

export class SoundService {
  private static context: AudioContext | null = null;
  private static gainNode: GainNode | null = null;
  private static recognition: SpeechRecognition | null = null;
  private static isListening: boolean = false;
  private static wakeWord: string = '贾维斯';
  private static isWakeWordDetected: boolean = false;
  private static conversationCallback: ((command: string) => void) | null = null;
  private static voiceEventListeners: Map<string, Array<(status: VoiceRecognitionStatus, command?: string, isProcessing?: boolean) => void>> = new Map();

  // Initialize all sound and speech services
  static initialize() {
    // Existing audio context initialization
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.gainNode.gain.value = 0.15; // Master volume
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    // Initialize speech recognition
    this.initializeSpeechRecognition();
    this.notifyVoiceEvent(VoiceRecognitionStatus.IDLE);
  }

  // Initialize speech recognition
  private static initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'zh-CN'; // Chinese language support

    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      console.log('Recognized:', transcript);
      this.handleSpeechResult(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // Restart recognition if it stops unexpectedly
      if (this.isListening) {
        setTimeout(() => this.startListening(), 1000);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart recognition when it ends
      if (this.isListening) {
        this.recognition?.start();
      }
    };

    this.recognition.onsoundstart = () => {
      this.notifyVoiceEvent(VoiceRecognitionStatus.RECOGNIZING);
    };

    this.recognition.onspeechend = () => {
      this.notifyVoiceEvent(VoiceRecognitionStatus.LISTENING);
    };
  }

  // Handle speech recognition results
  private static handleSpeechResult(transcript: string) {
    this.notifyVoiceEvent(VoiceRecognitionStatus.RECOGNIZING, transcript, true);
    
    // Check for wake word if not already detected
    if (!this.isWakeWordDetected) {
      if (transcript.includes(this.wakeWord) || transcript.includes('jarvis')) {
        this.isWakeWordDetected = true;
        this.speak('我在，有什么可以帮助您的？');
        // Play a confirmation sound
        this.playBlip();
        this.notifyVoiceEvent(VoiceRecognitionStatus.WAKE_WORD_DETECTED, transcript);
      } else {
        this.notifyVoiceEvent(VoiceRecognitionStatus.LISTENING, transcript);
      }
      return;
    }

    // If wake word already detected, process the command
    if (transcript.toLowerCase().includes('退出') || transcript.toLowerCase().includes('停止')) {
      this.speak('好的，我将停止监听。');
      this.isWakeWordDetected = false;
      this.playRelease();
      this.notifyVoiceEvent(VoiceRecognitionStatus.LISTENING, transcript);
    } else {
      // Pass the command to the conversation callback
      if (this.conversationCallback) {
        this.conversationCallback(transcript);
      } else {
        // Default response if no callback is set
        this.handleDefaultCommand(transcript);
      }
      this.notifyVoiceEvent(VoiceRecognitionStatus.LISTENING, transcript);
    }
  }

  // Default command handler
  private static handleDefaultCommand(command: string) {
    const lowerCommand = command.toLowerCase();
    
    // Simple command examples
    if (lowerCommand.includes('你好') || lowerCommand.includes('hello')) {
      this.speak('您好，我是贾维斯。');
    } else if (lowerCommand.includes('时间') || lowerCommand.includes('几点')) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      this.speak(`现在是 ${timeString}`);
    } else if (lowerCommand.includes('天气')) {
      this.speak('抱歉，当前暂不支持天气查询功能。');
    } else if (lowerCommand.includes('系统状态') || lowerCommand.includes('运行')) {
      this.speak('系统运行正常，所有模块已初始化。');
    } else if (lowerCommand.includes('帮助')) {
      this.speak('您可以使用语音命令与我交互，例如询问时间、系统状态等。说退出可以结束对话。');
    } else {
      this.speak('抱歉，我不太明白您的意思。请尝试其他命令。');
    }
  }

  // Start listening for speech
  static startListening(callback?: (command: string) => void) {
    if (callback) {
      this.conversationCallback = callback;
    }

    if (this.recognition && !this.isListening) {
      this.isListening = true;
      this.recognition.start();
      console.log('Speech recognition started...');
      this.notifyVoiceEvent(VoiceRecognitionStatus.LISTENING);
    }
  }

  // Stop listening for speech
  static stopListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.isWakeWordDetected = false;
      this.recognition.stop();
      this.conversationCallback = null;
      console.log('Speech recognition stopped.');
      this.notifyVoiceEvent(VoiceRecognitionStatus.IDLE);
    }
  }

  // Voice event handling
  private static notifyVoiceEvent(status: VoiceRecognitionStatus, command?: string, isProcessing: boolean = false) {
    const listeners = this.voiceEventListeners.get('statusChanged');
    if (listeners) {
      listeners.forEach(listener => listener(status, command, isProcessing));
    }
  }

  static addVoiceEventListener(event: string, callback: (status: VoiceRecognitionStatus, command?: string, isProcessing?: boolean) => void) {
    if (!this.voiceEventListeners.has(event)) {
      this.voiceEventListeners.set(event, []);
    }
    this.voiceEventListeners.get(event)?.push(callback);
  }

  static removeVoiceEventListener(event: string, callback: (status: VoiceRecognitionStatus, command?: string, isProcessing?: boolean) => void) {
    const listeners = this.voiceEventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Set custom wake word
  static setWakeWord(word: string) {
    this.wakeWord = word;
  }

  // Get current listening status
  static getListeningStatus() {
    return { isListening: this.isListening, isWakeWordDetected: this.isWakeWordDetected };
  }

  // Text-to-Speech implementation
  static speak(text: string) {
    if ('speechSynthesis' in window) {
        // Cancel any current speaking
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = 1;
        utterance.rate = 0.9; // Slightly slower for authority
        utterance.pitch = 0.85; // Slightly deeper

        // Try to select a British Male voice (closest to JARVIS standard)
        // Note: Voices load asynchronously in some browsers, but usually are available after user interaction
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            (v.name.includes('Great Britain') || v.name.includes('UK') || v.name.includes('English')) && 
            v.name.includes('Male')
        ) || voices.find(v => v.name.includes('Google UK English Male')) || voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    }
  }

  // Play a short high-pitched beep (UI hover/tick)
  static playBlip() {
    if (!this.context || !this.gainNode) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, this.context.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.05);

    osc.start();
    osc.stop(this.context.currentTime + 0.05);
  }

  // Play a mechanical lock/scan sound
  static playLock() {
    if (!this.context || !this.gainNode) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);

    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }

  // Play a release sound (reverse lock)
  static playRelease() {
    if (!this.context || !this.gainNode) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.type = 'square';
    osc.frequency.setValueAtTime(50, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.context.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.05, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);

    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }

  // Play a servo motor sound for expansion (Granular Synthesis style)
  static playServo(intensity: number) {
    if (!this.context || !this.gainNode) return;
    
    // Threshold check - significantly lowered to catch subtle movements
    // 0.001 is roughly the movement per frame during slow gestures
    if (intensity < 0.001) return; 

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    // Sawtooth gives a nice "buzzy" mechanical texture
    osc.type = 'sawtooth';
    
    // Pitch modulation: 
    // Base 60Hz (low hum) + Intensity scaler
    // Random jitter adds "texture" to prevent phasing artifacts when triggered rapidly
    const jitter = Math.random() * 20; 
    osc.frequency.setValueAtTime(60 + (intensity * 1500) + jitter, this.context.currentTime);
    
    // Lowpass filter mimics the enclosure of a motor
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400 + (intensity * 2000), this.context.currentTime);

    // Short burst (Grain)
    // Volume scaled by intensity
    const vol = Math.min(0.2, 0.05 + (intensity * 2)); 
    gain.gain.setValueAtTime(vol, this.context.currentTime);
    // Fast decay
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  // Play a heavy data-load/switch sound
  static playMapSwitch() {
    if (!this.context || !this.gainNode) return;
    
    const osc1 = this.context.createOscillator();
    const osc2 = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.gainNode);

    // Low heavy bass sweep
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150, this.context.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.5);

    // High tech chirp
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2000, this.context.currentTime);
    osc2.frequency.linearRampToValueAtTime(500, this.context.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);

    osc1.start();
    osc2.start();
    osc1.stop(this.context.currentTime + 0.5);
    osc2.stop(this.context.currentTime + 0.5);
  }

  // Ambient background hum
  static playAmbientHum() {
    if (!this.context || !this.gainNode) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.connect(gain);
    gain.connect(this.gainNode);
    
    osc.type = 'sawtooth';
    osc.frequency.value = 40;
    gain.gain.value = 0.03; // Quieter ambient
    
    osc.start();
  }
  
  static playBootSequence() {
     if (!this.context || !this.gainNode) return;
     const t = this.context.currentTime;
     
     const osc = this.context.createOscillator();
     const gain = this.context.createGain();
     osc.connect(gain);
     gain.connect(this.gainNode);
     
     osc.frequency.setValueAtTime(50, t);
     osc.frequency.exponentialRampToValueAtTime(800, t + 1.5);
     
     gain.gain.setValueAtTime(0, t);
     gain.gain.linearRampToValueAtTime(0.3, t + 0.5);
     gain.gain.linearRampToValueAtTime(0, t + 2.0);
     
     osc.start(t);
     osc.stop(t + 2.0);
  }
}