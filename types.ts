export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandInteractionData {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
  gesture?: string;
  pinchDistance?: number; // Normalized 0-1
  isPinching: boolean;
  expansionFactor: number; // 0 (Fist) to 1 (Open Palm)
  rotationControl: { x: number, y: number }; // -1 to 1 for both axes (Joystick style)
}

export interface HandTrackingState {
  leftHand: HandInteractionData | null;
  rightHand: HandInteractionData | null;
}

export enum RegionName {
  AMERICAS = "美洲扇区",
  PACIFIC = "太平洋监测区",
  ASIA = "亚洲战区",
  EUROPE = "欧洲防区",
  AFRICA = "非洲资源区"
}

export interface PanelPosition {
  x: number;
  y: number;
}

// Speech Recognition API Type Declarations
declare interface SpeechRecognitionResult {  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

declare interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation?: any;
}

declare interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare interface SpeechRecognition {
  new (): SpeechRecognition;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}

declare interface Window {
  SpeechRecognition?: SpeechRecognition;
  webkitSpeechRecognition?: SpeechRecognition;
}

declare interface SpeechRecognitionEventMap {
  audiostart: Event;
  audioend: Event;
  end: Event;
  error: SpeechRecognitionErrorEvent;
  nomatch: SpeechRecognitionEvent;
  result: SpeechRecognitionEvent;
  soundstart: Event;
  soundend: Event;
  speechstart: Event;
  speechend: Event;
  start: Event;
}

declare interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare module '*.task' {  const url: string;
  export default url;
}

declare module '*.task?url' {  const url: string;
  export default url;
}


// Voice Recognition Types
export enum VoiceRecognitionStatus {
  IDLE = "idle",
  LISTENING = "listening",
  RECOGNIZING = "recognizing",
  WAKE_WORD_DETECTED = "wake_word_detected"
}

export interface VoiceRecognitionState {
  status: VoiceRecognitionStatus;
  lastCommand?: string;
  isProcessing: boolean;
}