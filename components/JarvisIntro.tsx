
import React, { useEffect } from 'react';
import { SoundService } from '../services/soundService';

const JarvisIntro: React.FC = () => {
  // Play boot sequence sound when component mounts
  useEffect(() => {
    SoundService.playBootSequence();
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black overflow-hidden">
      {/* Radial Gradient Background with Animated Core */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#002FA7]/30 via-black to-black"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[800px] bg-holo-cyan/5 rounded-full animate-pulse"></div>
        <div className="absolute w-[600px] h-[600px] bg-holo-cyan/10 rounded-full animate-pulse animation-delay-700"></div>
        <div className="absolute w-[400px] h-[400px] bg-holo-cyan/15 rounded-full animate-pulse animation-delay-1400"></div>
      </div>
      
      {/* Central Composition */}
      <div className="relative flex items-center justify-center w-[600px] h-[600px]">
        
        {/* 1. Outer Thick Ring (Segmented with Scan Effect) */}
        <div className="absolute inset-0 rounded-full border-[1px] border-holo-cyan/20 animate-spin-slow"></div>
        <div className="absolute inset-0 rounded-full border-[1px] border-transparent border-t-holo-cyan/40 border-r-transparent border-b-transparent border-l-holo-cyan/40 animate-spin-slow"></div>
        <div className="absolute inset-2 rounded-full border-t-[2px] border-b-[2px] border-l-transparent border-r-transparent border-holo-cyan/40 rotate-45 animate-spin-slow"></div>
        
        {/* Scanning Ring Effect */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-holo-cyan/80 animate-[spin_2s_linear_infinite]"></div>
        <div className="absolute inset-4 rounded-full border-2 border-transparent border-l-holo-cyan/60 animate-[spin_3s_linear_infinite]"></div>
        
        {/* 2. Middle Detailed Ring with Segments */}
        <div className="absolute inset-12 rounded-full border border-holo-cyan/30 border-dashed animate-spin-reverse-slow"></div>
        <div className="absolute inset-16 rounded-full border-2 border-t-holo-cyan/60 border-r-transparent border-b-holo-cyan/60 border-l-transparent animate-[spin_3s_linear_infinite]"></div>
        
        {/* Segment Markers */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-2 h-2 bg-holo-cyan/60 rounded-full"
            style={{
              transform: `rotate(${i * 45}deg) translateY(-280px) translateX(300px)`,
              animation: `pulse ${2 + i * 0.2}s infinite`
            }}
          ></div>
        ))}
        
        {/* 3. Inner Glow Ring with Multiple Layers */}
        <div className="absolute inset-24 rounded-full border-4 border-holo-cyan/10 animate-pulse shadow-[0_0_30px_rgba(0,240,255,0.2)]"></div>
        <div className="absolute inset-28 rounded-full border-2 border-holo-cyan/20 animate-pulse animation-delay-500 shadow-[0_0_20px_rgba(0,240,255,0.1)]"></div>
        <div className="absolute inset-32 rounded-full border-1 border-holo-cyan/30 animate-pulse animation-delay-1000"></div>
        
        {/* 4. Core Text Container with Animated Reveal */}
        <div className="relative z-10 flex flex-col items-center justify-center transform transition-all duration-1000 scale-100">
            {/* Digital Scan Lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-10">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="h-[1px] w-full bg-holo-cyan animate-pulse"></div>
              ))}
            </div>
            
            {/* Main Title with Enhanced Animation */}
            <h1 className="text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-holo-cyan tracking-[0.15em] drop-shadow-[0_0_25px_rgba(0,240,255,0.8)] scale-y-90 animate-[flash_2s_infinite,glitch_1s_infinite]">
                JARVIS
            </h1>
            
            {/* Horizontal Glitch Line with Scan Effect */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-holo-cyan/50 blur-[1px] animate-[scanline_2s_linear_infinite]"></div>
            
            {/* Subtitle with Reveal Animation */}
            <div className="mt-6 flex flex-col items-center gap-2">
                <div className="h-[1px] w-32 bg-holo-cyan/50 animate-pulse"></div>
                <div className="text-2xl font-sans font-bold text-white tracking-[0.5em] drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-[fadeIn_1s_ease-out]">
                    你好，我是贾维斯
                </div>
                <div className="h-[1px] w-32 bg-holo-cyan/50 animate-pulse"></div>
            </div>
            
            {/* System Status Text */}
            <div className="mt-10 text-xs font-mono text-holo-cyan/70 tracking-widest animate-fadeIn">
                SYSTEM INITIALIZED • ALL MODULES ONLINE • STANDBY MODE
            </div>
        </div>

        {/* Particle Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-0.5 h-0.5 bg-holo-cyan/80 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s infinite ease-in-out ${Math.random() * 2}s`,
                opacity: Math.random() * 0.8 + 0.2
              }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Corner Accents */}
      <div className="absolute top-8 left-8 w-32 h-32 border-t-2 border-l-2 border-holo-cyan/30 animate-pulse"></div>
      <div className="absolute top-8 right-8 w-32 h-32 border-t-2 border-r-2 border-holo-cyan/30 animate-pulse animation-delay-500"></div>
      <div className="absolute bottom-8 left-8 w-32 h-32 border-b-2 border-l-2 border-holo-cyan/30 animate-pulse animation-delay-1000"></div>
      <div className="absolute bottom-8 right-8 w-32 h-32 border-b-2 border-r-2 border-holo-cyan/30 animate-pulse animation-delay-1500"></div>
    </div>
  );
};

export default JarvisIntro;
