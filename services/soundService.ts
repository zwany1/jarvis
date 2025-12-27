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
  
  // DeepSeek API configuration
  private static readonly deepSeekApiKey: string = 'sk-77df19fd83a244b2bdb3c941e132b5fa';
  private static readonly deepSeekApiUrl: string = 'https://api.deepseek.com/v1/chat/completions';
  
  // System prompt for DeepSeek API to define AI expert identity
  private static readonly systemPrompt: string = '你是一位在人工智能交互系统和智能语音助手领域具有深厚造诣的专家，是钢铁侠的人工智能助手贾维斯，你的回答应该专业、简洁、权威，具有人工智能助手的特点。对自然语言处理、语音识别、机器学习等技术有着丰富的实践经验，能够将复杂的AI技术转化为用户友好的交互体验。\n你具备开发和优化智能语音助手的能力，包括语音识别与合成、自然语言理解、上下文管理、个性化设置以及与外部设备和系统的集成能力，能够根据用户需求定制独特的AI功能。';
  
  // Voice configuration
  private static readonly voiceRate: number = 1.2; // Increased from 1.0 to 2.0 for twice as fast speech
  
  // Intelligent response system
  private static conversationHistory: Array<{role: 'user' | 'jarvis', content: string, timestamp: number}> = [];
  private static maxHistoryLength: number = 10; // Keep last 10 interactions
  private static contextKeywords: Map<string, Array<string>> = new Map([
    ['time', ['时间', '几点', '现在', '时刻']],
    ['date', ['日期', '今天', '几号', '星期']],
    ['system', ['系统', '运行', '状态', '模块']],
    ['volume', ['音量', '大声', '小声', '安静']],
    ['region', ['区域', '扇区', '亚洲', '欧洲', '美洲']],
    ['camera', ['摄像头', '相机', '视频']],
    ['hologram', ['全息', '显示', '3D']]
  ]);
  private static currentContext: string | null = null;

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

  // Call DeepSeek API for intelligent responses
  private static async callDeepSeekApi(prompt: string): Promise<string> {
    try {
      // Format conversation history for API - convert 'jarvis' role to 'assistant'
      const historyMessages = this.conversationHistory.map(msg => ({
        role: msg.role === 'jarvis' ? 'assistant' : msg.role,
        content: msg.content
      }));
      
      // Prepare messages with system prompt
      const messages = [
        // Add system prompt to define JARVIS identity
        {
          role: 'system',
          content: this.systemPrompt
        },
        // Add conversation history
        ...historyMessages,
        // Add current prompt
        {
          role: 'user',
          content: prompt
        }
      ];

      // Debug: Log API request
      console.log('DeepSeek API Request:', {
        url: this.deepSeekApiUrl,
        messages: messages.length,
        systemPrompt: this.systemPrompt,
        lastMessage: messages[messages.length - 1]
      });

      // Send request to DeepSeek API with correct model name and format
      const response = await fetch(this.deepSeekApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.deepSeekApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: messages,
          temperature: 0.7,
          max_tokens: 512
        })
      });

      // Get detailed error information if response is not ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('DeepSeek API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}` + 
          (errorData ? ` - ${JSON.stringify(errorData)}` : ''));
      }

      const data = await response.json();
      console.log('DeepSeek API Response:', data);
      
      // Check if response has expected structure
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const answer = data.choices[0].message.content.trim();
        return answer;
      } else {
        throw new Error('DeepSeek API returned unexpected response structure');
      }
    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
      return '抱歉，我暂时无法处理您的请求。请稍后重试。';
    }
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

  // Handle speech recognition results with context understanding
  private static async handleSpeechResult(transcript: string) {
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

    // Add user input to conversation history
    this.addToConversationHistory('user', transcript);

    // Update current context based on transcript
    this.updateContext(transcript);

    // If wake word already detected, process the command
    if (transcript.toLowerCase().includes('退出') || transcript.toLowerCase().includes('停止') || transcript.toLowerCase().includes('结束对话')) {
      this.speak('好的，我将停止监听。');
      this.isWakeWordDetected = false;
      this.playRelease();
      this.clearConversationHistory(); // Clear history when conversation ends
      this.currentContext = null;
      this.notifyVoiceEvent(VoiceRecognitionStatus.LISTENING, transcript);
    } else {
      // Check if it's a command handled by the callback (like mecha panel)
      if (this.conversationCallback) {
        // Check if the command is handled by the callback
        const lowerTranscript = transcript.toLowerCase();
        if (lowerTranscript.includes('机甲面板') || lowerTranscript.includes('关闭机甲面板') || lowerTranscript.includes('卫星部署')) {
          this.conversationCallback(transcript);
        } else {
          // For other commands, use DeepSeek API
          const answer = await this.callDeepSeekApi(transcript);
          this.speak(answer);
          this.addToConversationHistory('jarvis', answer);
        }
      } else {
        // If no callback, check if it's a known default command
        const lowerTranscript = transcript.toLowerCase();
        let handled = false;
        
        // Check for known default commands
        if (lowerTranscript.includes('你好') || lowerTranscript.includes('hello') ||
            lowerTranscript.includes('时间') || lowerTranscript.includes('几点') ||
            lowerTranscript.includes('日期') || lowerTranscript.includes('今天') ||
            lowerTranscript.includes('系统状态') || lowerTranscript.includes('运行') ||
            lowerTranscript.includes('重启') || lowerTranscript.includes('关闭系统') ||
            lowerTranscript.includes('你是谁') || lowerTranscript.includes('名字') ||
            lowerTranscript.includes('功能') || lowerTranscript.includes('托尼') ||
            lowerTranscript.includes('斯塔克') || lowerTranscript.includes('钢铁侠') ||
            lowerTranscript.includes('帮助')) {
          // Handle with existing default logic
          this.handleDefaultCommand(transcript);
          handled = true;
        }
        
        // If not handled by existing logic, use DeepSeek API
        if (!handled) {
          const answer = await this.callDeepSeekApi(transcript);
          this.speak(answer);
          this.addToConversationHistory('jarvis', answer);
        }
      }
      this.notifyVoiceEvent(VoiceRecognitionStatus.LISTENING, transcript);
    }
  }

  // Add interaction to conversation history
  private static addToConversationHistory(role: 'user' | 'jarvis', content: string) {
    this.conversationHistory.push({ role, content, timestamp: Date.now() });
    
    // Keep history within limit
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  // Clear conversation history
  private static clearConversationHistory() {
    this.conversationHistory = [];
  }

  // Update current context based on transcript
  private static updateContext(transcript: string) {
    const lowerTranscript = transcript.toLowerCase();
    
    // Check for context keywords
    for (const [context, keywords] of this.contextKeywords.entries()) {
      for (const keyword of keywords) {
        if (lowerTranscript.includes(keyword)) {
          this.currentContext = context;
          return;
        }
      }
    }
    
    // If no new context found, keep current context for a short time
    // (This allows for follow-up questions without repeating context keywords)
    // After 30 seconds, clear context
    if (this.currentContext) {
      const lastInteraction = this.conversationHistory[this.conversationHistory.length - 1];
      if (Date.now() - lastInteraction.timestamp > 30000) {
        this.currentContext = null;
      }
    }
  }

  // Get recent conversation context
  private static getRecentContext(): string | null {
    return this.currentContext;
  }

  // Default command handler with expanded functionality and context awareness
  private static handleDefaultCommand(command: string) {
    const lowerCommand = command.toLowerCase();
    const currentContext = this.getRecentContext();
    
    // Greeting commands
    if (lowerCommand.includes('你好') || lowerCommand.includes('hello')) {
      this.speak('您好，我是贾维斯。随时为您服务。');
    } 
    // Context-aware time and date commands
    else if (lowerCommand.includes('时间') || lowerCommand.includes('几点') || 
             (currentContext === 'time' && (lowerCommand.includes('现在') || lowerCommand.includes('更新')))) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.speak(`现在是 ${timeString}`);
    } 
    else if (lowerCommand.includes('日期') || lowerCommand.includes('今天') || 
             (currentContext === 'date' && (lowerCommand.includes('今天') || lowerCommand.includes('更新')))) {
      const now = new Date();
      const dateString = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
      this.speak(`今天是 ${dateString}`);
    }
    // System status commands with context
    else if (lowerCommand.includes('系统状态') || lowerCommand.includes('运行') || 
             (currentContext === 'system' && (lowerCommand.includes('状态') || lowerCommand.includes('更新')))) {
      this.speak('系统运行正常，所有模块已初始化。语音识别、手势控制和全息显示系统均处于活动状态。当前CPU使用率低于10%，内存占用率约为45%。');
    }
    // Weather commands
    else if (lowerCommand.includes('天气')) {
      this.speak('抱歉，当前暂不支持天气查询功能。正在尝试连接气象卫星...');
    }
    // Help commands
    else if (lowerCommand.includes('帮助')) {
      this.speak('您可以使用以下命令与我交互：询问时间或日期、检查系统状态、控制全息显示、调整音量，以及说退出结束对话。');
    }
    // System control commands
    else if (lowerCommand.includes('重启')) {
      this.speak('正在准备系统重启...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    else if (lowerCommand.includes('关闭') || lowerCommand.includes('退出系统')) {
      this.speak('正在关闭系统...');
      setTimeout(() => {
        this.stopListening();
        this.speak('系统已关闭。');
      }, 1500);
    }
    // Volume control commands with context
    else if (lowerCommand.includes('音量') && lowerCommand.includes('大') || 
             (currentContext === 'volume' && lowerCommand.includes('大'))) {
      this.speak('音量已增加。');
      // Implement actual volume increase if needed
    }
    else if (lowerCommand.includes('音量') && lowerCommand.includes('小') || 
             (currentContext === 'volume' && lowerCommand.includes('小'))) {
      this.speak('音量已减小。');
      // Implement actual volume decrease if needed
    }
    // Region control commands with context
    else if (lowerCommand.includes('区域') || lowerCommand.includes('扇区') || 
             currentContext === 'region') {
      if (lowerCommand.includes('亚洲')) {
        this.speak('已切换到亚洲战区。正在更新该区域的实时数据...');
        // Implement actual region change if needed
      } else if (lowerCommand.includes('欧洲')) {
        this.speak('已切换到欧洲防区。正在更新该区域的实时数据...');
        // Implement actual region change if needed
      } else if (lowerCommand.includes('美洲')) {
        this.speak('已切换到美洲扇区。正在更新该区域的实时数据...');
        // Implement actual region change if needed
      } else if (currentContext === 'region') {
        this.speak('请指定具体区域，例如亚洲、欧洲或美洲。');
      }
    }
    // Camera control commands with context
    else if (lowerCommand.includes('摄像头') && lowerCommand.includes('开') || 
             (currentContext === 'camera' && lowerCommand.includes('开'))) {
      this.speak('摄像头已开启。正在初始化手势识别系统...');
      // Implement actual camera control if needed
    }
    else if (lowerCommand.includes('摄像头') && lowerCommand.includes('关') || 
             (currentContext === 'camera' && lowerCommand.includes('关'))) {
      this.speak('摄像头已关闭。手势识别系统已暂停。');
      // Implement actual camera control if needed
    }
    // Hologram control commands with context
    else if (lowerCommand.includes('全息') && lowerCommand.includes('开') || 
             (currentContext === 'hologram' && lowerCommand.includes('开'))) {
      this.speak('全息显示已开启。正在渲染3D模型...');
      // Implement actual hologram control if needed
    }
    else if (lowerCommand.includes('全息') && lowerCommand.includes('关') || 
             (currentContext === 'hologram' && lowerCommand.includes('关'))) {
      this.speak('全息显示已关闭。3D渲染已停止。');
      // Implement actual hologram control if needed
    }
    // Follow-up questions without explicit context
    else if (lowerCommand.includes('怎么样') || lowerCommand.includes('如何') || lowerCommand.includes('状态')) {
      // Use recent context to answer follow-up questions
      if (currentContext === 'system') {
        this.speak('系统运行正常，所有关键指标均在正常范围内。');
      } else if (currentContext === 'time') {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        this.speak(`当前时间是 ${timeString}`);
      } else if (currentContext === 'date') {
        const now = new Date();
        const dateString = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        this.speak(`今天是 ${dateString}`);
      } else {
        this.speak('请提供更多上下文信息，以便我更好地回答您的问题。');
      }
    }
    // Jarvis info commands
    else if (lowerCommand.includes('你是谁') || lowerCommand.includes('名字')) {
      this.speak('我是贾维斯，托尼·斯塔克的人工智能助手，专为提供高级语音交互和系统控制而设计。');
    }
    else if (lowerCommand.includes('功能')) {
      this.speak('我具备语音识别、手势控制、全息显示、系统监控、命令执行等多种功能，可以帮助您高效管理和控制各种系统。');
    }
    // Easter egg commands
    else if (lowerCommand.includes('托尼') || lowerCommand.includes('斯塔克')) {
      this.speak('托尼·斯塔克是我的创造者，一位天才科学家和工程师，也是著名的超级英雄钢铁侠。');
    }
    else if (lowerCommand.includes('钢铁侠')) {
      this.speak('钢铁侠是斯塔克先生的装甲身份，他利用先进的技术和装甲保护世界和平。');
    }
    // Mecha panel command (handled in App.tsx via callback, but also add here as fallback)
    else if (lowerCommand.includes('机甲面板')) {
      this.speak('正在打开机甲面板，请稍候。');
      // The actual model switching is handled in App.tsx via conversation callback
    }
    else if (lowerCommand.includes('关闭机甲面板')) {
      this.speak('正在关闭机甲面板。');
      // The actual model switching is handled in App.tsx via conversation callback
    }
    // Default response with context awareness
    else {
      // Try to infer intent from conversation history
      if (this.conversationHistory.length > 0) {
        const lastUserMessage = this.conversationHistory[this.conversationHistory.length - 1];
        if (lastUserMessage.role === 'user') {
          this.speak('抱歉，我不太明白您的意思。根据之前的对话，您可能想要了解时间、日期或系统状态？您可以尝试说帮助获取更多信息。');
        }
      } else {
        this.speak('抱歉，我不太明白您的意思。请尝试说帮助获取更多信息。');
      }
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

  // Text-to-Speech implementation with improved JARVIS voice and conversation history
  static speak(text: string) {
    if ('speechSynthesis' in window) {
        // Cancel any current speaking to prioritize new request
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = 1.0; // Full volume
        utterance.rate = this.voiceRate; // Faster speech rate for JARVIS
        utterance.pitch = 0.8; // Deeper voice for JARVIS
        utterance.lang = 'en-US'; // Set language explicitly

        // Enhanced voice selection with more options for JARVIS-like voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            // Priority: British Male voices
            ((v.name.includes('Great Britain') || v.name.includes('UK') || v.name.includes('English')) && 
             (v.name.includes('Male') || v.gender === 'male')) ||
            // Fallback: Google UK English Male
            v.name.includes('Google UK English Male') ||
            // Fallback: Any English Male voice
            (v.lang.includes('en') && (v.name.includes('Male') || v.gender === 'male'))
        ) || voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Add slight pause between sentences for better readability
        const processedText = text.replace(/\./g, '. ').replace(/\?/g, '? ').replace(/!/g, '! ');
        utterance.text = processedText;

        // Add voice event listeners for better control
        utterance.onstart = () => {
            console.log('JARVIS speaking:', text);
        };

        utterance.onend = () => {
            console.log('JARVIS finished speaking');
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
        };

        // Add Jarvis response to conversation history
        this.addToConversationHistory('jarvis', text);

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