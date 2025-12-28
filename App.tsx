
import React, { useRef, useState, useCallback, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import VideoFeed from './components/VideoFeed';
import HolographicEarth from './components/HolographicEarth';
import MechaModel from './components/MechaModel';
import HUDOverlay from './components/HUDOverlay';
import JarvisIntro from './components/JarvisIntro';
import WorldMap from './components/WorldMap';
import { HandTrackingState, RegionName, VoiceRecognitionState, VoiceRecognitionStatus } from './types';
import { SoundService } from './services/soundService';

const App: React.FC = () => {
  const handTrackingRef = useRef<HandTrackingState>({
    leftHand: null,
    rightHand: null
  });

  const [currentRegion, setCurrentRegion] = useState<RegionName>(RegionName.ASIA);
  const [booted, setBooted] = useState(false);
  const [introActive, setIntroActive] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  // New state for mecha model display
  const [showMechaModel, setShowMechaModel] = useState(false);
  // State for world map display
  const [showWorldMap, setShowWorldMap] = useState(false);
  
  // Voice recognition state management
  const [voiceRecognitionState, setVoiceRecognitionState] = useState<VoiceRecognitionState>({
    status: VoiceRecognitionStatus.IDLE,
    isProcessing: false
  });

  const handleTrackingUpdate = useCallback((newState: HandTrackingState) => {
    handTrackingRef.current = newState;
  }, []);

  // Boot Sequence Logic
  const startSystem = () => {
    SoundService.initialize();
    SoundService.playBlip(); // Immediate feedback
    SoundService.playBootSequence();
    
    // Staggered animation state for loading bars
    setBootStep(1); // Initialize
    setTimeout(() => setBootStep(2), 800); // Loading Modules
    setTimeout(() => setBootStep(3), 1800); // Authentication
    
    // After text logs, show Jarvis Intro
    setTimeout(() => {
        setIntroActive(true);
        SoundService.speak("Hello. I am Jarvis.");
        
        // After Intro, show main app
        setTimeout(() => {
             setIntroActive(false);
             setBooted(true);
             SoundService.playAmbientHum();
             // Start voice recognition after full boot with command callback
             SoundService.startListening((command) => {
               // Handle "机甲面板" command
               if (command.includes('机甲面板')) {
                 setShowMechaModel(true);
                 SoundService.speak('已打开机甲面板');
               }
               // Add command to close mecha model
               else if (command.includes('关闭机甲面板')) {
                 setShowMechaModel(false);
                 SoundService.speak('已关闭机甲面板');
               }
               // Add command for satellite deployment (returns to Earth model)
               else if (command.includes('卫星部署')) {
                 setShowMechaModel(false);
                 SoundService.speak('卫星部署指令已执行，前往地球模型');
               }
               // Handle "世界地图" command
               else if (command.includes('世界地图')) {
                 setShowWorldMap(true);
                 SoundService.speak('已打开世界地图');
               }
               // Handle "关闭世界地图" command
               else if (command.includes('关闭世界地图')) {
                 setShowWorldMap(false);
                 SoundService.speak('已关闭世界地图');
               }
             });
             setVoiceRecognitionState(prev => ({ ...prev, status: VoiceRecognitionStatus.LISTENING }));
        }, 2800); // Intro duration
    }, 2500); // Boot text logs duration
  };

  // Voice recognition state updates
  useEffect(() => {
    const updateVoiceStatus = (status: VoiceRecognitionStatus, command?: string, isProcessing?: boolean) => {
      setVoiceRecognitionState(prev => ({
        ...prev,
        status,
        lastCommand: command,
        isProcessing: isProcessing ?? prev.isProcessing
      }));
    };

    // Subscribe to voice recognition events
    SoundService.addVoiceEventListener('statusChanged', updateVoiceStatus);

    // Cleanup
    return () => {
      SoundService.removeVoiceEventListener('statusChanged', updateVoiceStatus);
    };
  }, []);

  // Render Boot Screen
  if (!booted && !introActive) {
      return (
          <div className="relative w-full h-screen bg-black text-holo-cyan font-mono flex flex-col items-center justify-center overflow-hidden">
              <div className="scanlines opacity-20"></div>
              
              {/* Background geometric elements */}
              <div className="absolute w-[600px] h-[600px] border border-gray-800 rounded-full animate-spin-slow opacity-30"></div>
              <div className="absolute w-[400px] h-[400px] border border-dashed border-klein-blue rounded-full animate-spin-reverse-slow opacity-30"></div>
              
              {bootStep === 0 && (
                  <button 
                    onClick={startSystem}
                    className="z-10 group relative px-8 py-4 bg-transparent border border-holo-cyan text-holo-cyan font-display font-bold tracking-[0.3em] text-xl hover:bg-holo-cyan/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="absolute inset-0 w-full h-full border border-holo-cyan blur-[2px] opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    初始化 J.A.R.V.I.S.
                  </button>
              )}

              {bootStep >= 1 && (
                  <div className="z-10 flex flex-col items-center gap-4 w-96">
                      <div className="text-2xl font-display font-bold animate-pulse">
                          {bootStep === 1 && "系统启动中..."}
                          {bootStep === 2 && "加载神经网络..."}
                          {bootStep === 3 && "身份验证中..."}
                      </div>
                      <div className="w-full h-1 bg-gray-800 rounded overflow-hidden">
                          <div 
                            className="h-full bg-holo-cyan shadow-[0_0_10px_#00F0FF] transition-all duration-1000 ease-out"
                            style={{ width: bootStep === 1 ? '10%' : bootStep === 2 ? '60%' : '100%' }}
                          ></div>
                      </div>
                      <div className="text-xs text-gray-500 h-20 overflow-hidden w-full text-center leading-tight">
                          {bootStep >= 1 && <div> 内存分配检查... 完成</div>}
                          {bootStep >= 1 && <div> GPU 委托... 已分配</div>}
                          {bootStep >= 2 && <div> 加载 MEDIA_PIPE.WASM...</div>}
                          {bootStep >= 2 && <div> 连接卫星信号...</div>}
                          {bootStep >= 3 && <div> 视网膜扫描... 已绕过</div>}
                          {bootStep >= 3 && <div className="text-green-500"> 访问被允许</div>}
                      </div>
                  </div>
              )}
              
              <div className="absolute bottom-8 text-[10px] text-gray-600">斯塔克工业 专有技术</div>
          </div>
      )
  }

  // Render Intro Screen
  if (introActive) {
      return <JarvisIntro />;
  }

  // Render Main App
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden animate-flash">
      {/* 1. Background Camera Layer */}
      <VideoFeed onTrackingUpdate={handleTrackingUpdate} />

      {/* 2. 3D Scene Layer - Show Earth or Mecha Model based on state */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Canvas 
            camera={{ position: [0, 0, 5], fov: 45 }} 
            gl={{ alpha: true, antialias: false }} // Disable native AA for PostProcessing bloom efficiency
            dpr={[1, 1.5]} // Optimization for high DPI screens
        >
            <Suspense fallback={null}>
              {showMechaModel ? (
                // Show mecha model when activated
                <MechaModel 
                    handTrackingRef={handTrackingRef} 
                />
              ) : (
                // Show Earth model by default
                <HolographicEarth 
                    handTrackingRef={handTrackingRef} 
                    setRegion={setCurrentRegion}
                />
              )}
            </Suspense>
        </Canvas>
      </div>

      {/* 3. UI/HUD Layer */}
      <HUDOverlay 
        handTrackingRef={handTrackingRef} 
        currentRegion={currentRegion}
        voiceRecognitionState={voiceRecognitionState}
        showMechaModel={showMechaModel}
      />

      {/* 4. World Map Modal */}
      {showWorldMap && (
        <WorldMap onClose={() => setShowWorldMap(false)} />
      )}
    </div>
  );
};

export default App;