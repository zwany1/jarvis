import React, { useRef, useEffect, useState } from 'react';
import { HandTrackingState, RegionName, VoiceRecognitionState } from '../types';
import { SoundService } from '../services/soundService';

interface HUDOverlayProps {
  handTrackingRef: React.MutableRefObject<HandTrackingState>;
  currentRegion: RegionName;
  voiceRecognitionState: VoiceRecognitionState;
  showMechaModel: boolean;
}

// --- Sub-Components for Static HUD Elements ---

const CircularGauge = ({ label, value, color = "text-holo-cyan", mechaMode = false }: { label: string, value: string, color?: string, mechaMode?: boolean }) => (
  <div className={`relative w-36 h-36 flex items-center justify-center ${mechaMode ? 'scale-110' : ''}`}>
    {/* Outer Static Ring */}
    <div className={`absolute inset-0 border-2 ${color} opacity-40 rounded-full border-t-transparent border-l-transparent -rotate-45 ${mechaMode ? 'border-4' : ''}`}></div>
    {/* Middle Static Ring */}
    <div className={`absolute inset-3 border-1 ${color} opacity-20 rounded-full ${mechaMode ? 'border-2' : ''}`}></div>
    {/* Inner Spinning Ring */}
    <div className={`absolute inset-2 border-2 ${color} opacity-80 rounded-full border-b-transparent border-r-transparent animate-spin-slow ${mechaMode ? 'border-3 animate-spin' : ''}`}></div>
    {/* Dynamic Progress Ring */}
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="rgba(0, 240, 255, 0.2)"
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke={color.replace('text-', '')}
        strokeWidth="2"
        strokeDasharray="283"
        strokeDashoffset="71"
        strokeLinecap="round"
        className="animate-spin-reverse-slow"
      />
    </svg>
    {/* Core Value */}
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-display font-bold ${color} drop-shadow-[0_0_10px_rgba(0,240,255,0.9)] ${mechaMode ? 'text-3xl' : ''}`}>{value}</span>
      <span className={`text-[9px] uppercase tracking-widest opacity-90 ${mechaMode ? 'text-white' : ''}`}>{label}</span>
    </div>
    {/* Mecha Mode Decorative Elements */}
    {mechaMode && (
      <>
        <div className="absolute inset-0 border-1 border-white/10 rounded-full animate-pulse-slow"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-1 left-1/2 transform -translate-x-1/2"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full bottom-1 left-1/2 transform -translate-x-1/2"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full left-1 top-1/2 transform -translate-y-1/2"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full right-1 top-1/2 transform -translate-y-1/2"></div>
      </>
    )}
  </div>
);

// Mecha System Status Panel
const MechaStatusPanel = ({ status }: { status: { reactorTemp: string, thrusterStatus: string, weaponsSystem: string, flightMode: string, shieldsStatus: string, targetingSystem: string } }) => (
  <div className="bg-black/80 border border-holo-cyan/40 p-4 rounded-lg backdrop-blur-sm shadow-[0_0_30px_rgba(0,240,255,0.5)] bg-[linear-gradient(45deg,transparent_25%,rgba(0,240,255,0.05)_25%,rgba(0,240,255,0.05)_50%,transparent_50%,transparent_75%,rgba(0,240,255,0.05)_75%,rgba(0,240,255,0.05)_100%)] bg-[length:20px_20px]">
    <h3 className="text-xs uppercase tracking-widest text-holo-cyan mb-3 border-b border-holo-cyan/30 pb-2 flex items-center gap-2">
      <div className="w-2 h-2 bg-holo-cyan animate-pulse"></div>
      机甲系统状态
      <div className="ml-auto text-[8px] text-holo-blue">MK VII</div>
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-400 uppercase">反应堆温度</span>
          <span className="text-holo-cyan font-mono text-sm">{status.reactorTemp}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-sm overflow-hidden border border-holo-cyan/20">
          <div 
            className="h-full bg-gradient-to-r from-holo-cyan via-yellow-500 to-alert-red relative overflow-hidden"
            style={{ 
              width: `${Math.min(100, parseInt(status.reactorTemp) / 3.5)}%`,
              animation: 'pulse 2s infinite'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-400 uppercase">推进器状态</span>
          <span className={`font-mono text-sm ${status.thrusterStatus === 'ONLINE' ? 'text-holo-cyan' : 'text-yellow-500'}`}>
            {status.thrusterStatus}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-sm overflow-hidden border border-holo-cyan/20">
          <div 
            className={`h-full ${status.thrusterStatus === 'ONLINE' ? 'bg-holo-cyan' : 'bg-yellow-500'}`} 
            style={{ width: status.thrusterStatus === 'ONLINE' ? '100%' : '50%' }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-400 uppercase">武器系统</span>
          <span className={`font-mono text-sm ${status.weaponsSystem === 'READY' ? 'text-alert-red' : 'text-holo-cyan'}`}>
            {status.weaponsSystem}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-sm overflow-hidden border border-holo-cyan/20">
          <div 
            className={`h-full ${status.weaponsSystem === 'READY' ? 'bg-alert-red animate-pulse' : 'bg-holo-cyan'}`} 
            style={{ width: status.weaponsSystem === 'READY' ? '100%' : '30%' }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-400 uppercase">飞行模式</span>
          <span className={`font-mono text-sm ${status.flightMode === 'ON' ? 'text-holo-blue' : 'text-gray-500'}`}>
            {status.flightMode}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-sm overflow-hidden border border-holo-cyan/20">
          <div 
            className={`h-full ${status.flightMode === 'ON' ? 'bg-holo-blue animate-pulse' : 'bg-gray-600'}`} 
            style={{ width: status.flightMode === 'ON' ? '100%' : '0%' }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-400 uppercase">护盾状态</span>
          <span className={`font-mono text-sm ${status.shieldsStatus === 'ACTIVE' ? 'text-holo-cyan' : 'text-gray-500'}`}>
            {status.shieldsStatus}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-sm overflow-hidden border border-holo-cyan/20">
          <div 
            className={`h-full ${status.shieldsStatus === 'ACTIVE' ? 'bg-holo-cyan animate-pulse' : 'bg-gray-600'}`} 
            style={{ width: status.shieldsStatus === 'ACTIVE' ? '100%' : '0%' }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-400 uppercase">瞄准系统</span>
          <span className={`font-mono text-sm ${status.targetingSystem === 'LOCKED' ? 'text-alert-red' : 'text-holo-cyan'}`}>
            {status.targetingSystem}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-sm overflow-hidden border border-holo-cyan/20">
          <div 
            className={`h-full ${status.targetingSystem === 'LOCKED' ? 'bg-alert-red animate-pulse' : 'bg-holo-cyan'}`} 
            style={{ width: status.targetingSystem === 'LOCKED' ? '100%' : '80%' }}
          ></div>
        </div>
      </div>
    </div>
  </div>
);

// Mecha Armor Integrity Display
const ArmorIntegrityDisplay = ({ integrity }: { integrity: string }) => {
  const percentage = parseInt(integrity);
  const color = percentage > 70 ? '#00F0FF' : percentage > 30 ? '#FACC15' : '#EF4444';
  
  return (
    <div className="bg-black/80 border border-holo-cyan/40 p-4 rounded-lg backdrop-blur-sm shadow-[0_0_30px_rgba(0,240,255,0.5)] bg-[linear-gradient(45deg,transparent_25%,rgba(0,240,255,0.05)_25%,rgba(0,240,255,0.05)_50%,transparent_50%,transparent_75%,rgba(0,240,255,0.05)_75%,rgba(0,240,255,0.05)_100%)] bg-[length:20px_20px]">
      <div className="flex flex-col items-center">
        <div className="text-xs uppercase tracking-widest text-holo-cyan mb-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-holo-cyan animate-pulse"></div>
          装甲完整性
        </div>
        <div className="relative w-48 h-48">
          {/* Animated Background Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[length:10px_10px] animate-pulse-slow"></div>
          
          {/* Outer Static Ring */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(0, 240, 255, 0.1)"
              strokeWidth="4"
            />
          </svg>
          
          {/* Middle Rotating Ring */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(0, 240, 255, 0.3)"
              strokeWidth="2"
              strokeDasharray="8 8"
              className="animate-spin-slow"
            />
          </svg>
          
          {/* Main Progress Ring */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(0, 240, 255, 0.2)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset={`${251.2 - (percentage / 100) * 251.2}`}
              strokeLinecap="round"
              className="animate-pulse-slow"
              transform="rotate(-90 50 50)"
            />
            {/* Glow Effect */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset={`${251.2 - (percentage / 100) * 251.2}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ filter: 'blur(8px)', opacity: 0.5 }}
            />
          </svg>
          
          {/* Center Core */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center">
              {/* Inner Core Glow */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-${color.replace('#', '')}10 to-transparent shadow-[0_0_30px_${color}] animate-pulse`}></div>
              {/* Main Core */}
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-${color.replace('#', '')}20 to-${color.replace('#', '')}10 border-2 border-${color.replace('#', '')}60 flex items-center justify-center`}>
                <div className={`w-4 h-4 rounded-full bg-${color} shadow-[0_0_15px_${color}] animate-pulse`}></div>
              </div>
            </div>
            
            {/* Percentage Text */}
            <span className={`text-5xl font-display font-bold ${percentage > 70 ? 'text-holo-cyan' : percentage > 30 ? 'text-yellow-500' : 'text-alert-red'} drop-shadow-[0_0_12px_rgba(0,240,255,0.9)] mt-4`}>
              {integrity}
            </span>
            <span className="text-[8px] uppercase tracking-widest opacity-80 mt-1">完整度</span>
            
            {/* Status Indicator */}
            <div className="mt-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${percentage > 70 ? 'bg-holo-cyan' : percentage > 30 ? 'bg-yellow-500' : 'bg-alert-red'}`}></div>
              <span className="text-[8px] uppercase tracking-widest">
                {percentage > 70 ? '状态良好' : percentage > 30 ? '需要注意' : '严重损坏'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Targeting Grid Overlay for Mecha Mode
const TargetingGrid = () => (
  <div className="absolute inset-0 z-10 pointer-events-none opacity-20">
    {/* Dynamic Scan Lines */}
    <div className="absolute inset-0 bg-[linear-gradient(to bottom,transparent_0%,rgba(0,240,255,0.1)_50%,transparent_100%)] bg-[length:100%_4px] animate-scan"></div>
    
    {/* Vertical Grid Lines */}
    <div className="absolute inset-0 flex justify-between">
      {[...Array(21)].map((_, i) => (
        <div 
          key={`v-${i}`} 
          className="w-px bg-gradient-to-b from-transparent via-holo-cyan/40 to-transparent h-full"
          style={{ left: `${i * 5}%` }}
        ></div>
      ))}
    </div>
    
    {/* Horizontal Grid Lines */}
    <div className="absolute inset-0 flex flex-col justify-between">
      {[...Array(21)].map((_, i) => (
        <div 
          key={`h-${i}`} 
          className="h-px bg-gradient-to-r from-transparent via-holo-cyan/40 to-transparent w-full"
          style={{ top: `${i * 5}%` }}
        ></div>
      ))}
    </div>
    
    {/* Center Crosshair */}
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Outer Scan Ring */}
      <div className="absolute w-64 h-64 border-2 border-holo-cyan/20 rounded-full animate-pulse-slow"></div>
      <div className="absolute w-80 h-80 border border-holo-cyan/10 rounded-full animate-pulse-slow"></div>
      
      {/* Middle Targeting Ring */}
      <div className="absolute w-40 h-40 border-2 border-dashed border-holo-cyan/40 rounded-full animate-spin"></div>
      <div className="absolute w-32 h-32 border border-dotted border-holo-cyan/30 rounded-full animate-spin-reverse"></div>
      
      {/* Main Crosshair */}
      <div className="w-24 h-1 bg-gradient-to-r from-transparent via-holo-cyan/80 to-transparent"></div>
      <div className="absolute w-1 h-24 bg-gradient-to-b from-transparent via-holo-cyan/80 to-transparent"></div>
      
      {/* Center Dots */}
      <div className="absolute w-8 h-8 border-2 border-holo-cyan/80 rounded-full animate-pulse"></div>
      <div className="absolute w-4 h-4 bg-holo-cyan/80 rounded-full"></div>
      <div className="absolute w-2 h-2 bg-alert-red shadow-[0_0_10px_rgba(239,68,68,0.9)] rounded-full animate-pulse"></div>
      
      {/* Crosshair Extensions */}
      <div className="absolute w-1 h-6 bg-holo-cyan/60 -top-28"></div>
      <div className="absolute w-1 h-6 bg-holo-cyan/60 -bottom-28"></div>
      <div className="absolute w-6 h-1 bg-holo-cyan/60 -left-28"></div>
      <div className="absolute w-6 h-1 bg-holo-cyan/60 -right-28"></div>
    </div>
    
    {/* Corner Markers */}
    <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-holo-cyan/60"></div>
    <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-holo-cyan/60"></div>
    <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-holo-cyan/60"></div>
    <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-holo-cyan/60"></div>
    
    {/* Distance Markers */}
    <div className="absolute top-1/2 left-16 transform -translate-y-1/2 text-[8px] text-holo-cyan/60 rotate-90">1000m</div>
    <div className="absolute top-1/2 right-16 transform -translate-y-1/2 text-[8px] text-holo-cyan/60 -rotate-90">1000m</div>
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-[8px] text-holo-cyan/60">1000m</div>
    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-[8px] text-holo-cyan/60">1000m</div>
  </div>
);

// Right Eye Tracker for Mecha Panel
const RightEyeTracker = ({ eyePos }: { eyePos: { x: number, y: number } }) => {
  // Map eye position to screen movement (scaling factor for more dramatic effect)
  const translateX = eyePos.x * 100; // Scale by 100px for noticeable movement
  const translateY = eyePos.y * 100; // Scale by 100px for noticeable movement
  
  return (
    <div 
      className="absolute top-[35%] right-[65%] z-40 pointer-events-none"
      style={{ 
        transform: `translate(0, 0) translate(${translateX}px, ${translateY}px)`,
        transition: 'transform 0.1s ease-out' // Smooth transition for eye movement
      }}
    >
      {/* Main Eye Tracking Circle */}
      <div className="relative w-40 h-40 rounded-full flex items-center justify-center">
        {/* Outer Glowing Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-holo-cyan/40 animate-pulse-slow shadow-[0_0_30px_rgba(0,240,255,0.6)]"></div>
        
        {/* Inner Rotating Ring */}
        <div className="absolute inset-2 rounded-full border-[4px] border-transparent border-t-holo-cyan/60 border-l-holo-cyan/60 animate-spin-slow"></div>
        
        {/* Crosshair Lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-holo-cyan/80 to-transparent"></div>
          <div className="absolute h-full w-px bg-gradient-to-b from-transparent via-holo-cyan/80 to-transparent"></div>
        </div>
        
        {/* Center Dot - Follows eye position */}
        <div 
          className="absolute w-3 h-3 rounded-full bg-alert-red animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.9)]"
          style={{ 
            transform: `translate(${eyePos.x * 20}px, ${eyePos.y * 20}px)`, // More subtle movement for the dot
            transition: 'transform 0.1s ease-out'
          }}
        ></div>
        
        {/* Additional Tracking Elements */}
        <div className="absolute top-4 right-4 w-8 h-8 border border-yellow-500/50 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border border-holo-blue/50 rounded-full animate-pulse-slow"></div>
        
        {/* Targeting Reticles */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-dashed border-white/30 rounded-full animate-spin-reverse-slow"
          style={{ 
            transform: `translate(-50%, -50%) translate(${eyePos.x * 10}px, ${eyePos.y * 10}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-dotted border-holo-cyan/40 rounded-full animate-spin"
          style={{ 
            transform: `translate(-50%, -50%) translate(${eyePos.x * 15}px, ${eyePos.y * 15}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        ></div>
        
        {/* Dynamic Eye Gaze Line */}
        <div 
          className="absolute top-1/2 left-1/2 w-40 h-px bg-gradient-to-r from-holo-cyan/80 via-holo-cyan/40 to-transparent"
          style={{ 
            transformOrigin: 'left center',
            transform: `rotate(${(Math.atan2(eyePos.y, eyePos.x) * 180) / Math.PI}deg) translate(20px, -1px)`,
            transition: 'transform 0.1s ease-out'
          }}
        ></div>
      </div>
      
      {/* Status Text */}
      <div className="mt-2 text-center">
        <div className="text-xs uppercase tracking-widest text-holo-cyan/80"></div>
        <div className="text-[8px] text-yellow-500/70 animate-blink">锁定目标</div>
        <div className="text-[6px] text-gray-500 mt-1">
          眼部位置: X: {eyePos.x.toFixed(2)}, Y: {eyePos.y.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

// Voice Recognition Status Indicator - Wavy Line Style
const VoiceRecognitionIndicator = ({ state }: { state: VoiceRecognitionState }) => {
  const getStatusColor = () => {
    switch (state.status) {
      case "listening":
        return "#00F0FF";
      case "recognizing":
        return "#FACC15";
      case "wake_word_detected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case "listening":
        return "监听中...";
      case "recognizing":
        return "识别中...";
      case "wake_word_detected":
        return "已唤醒！";
      default:
        return "待命";
    }
  };

  // Get wavy line styles based on status
  const getWavyLineStyles = () => {
    const color = getStatusColor();
    let animation = "animate-pulse-slow";
    let glow = "shadow-[0_0_20px_rgba(0,240,255,0.6)]";

    switch (state.status) {
      case "recognizing":
        animation = "animate-wavy-line-fast";
        glow = "shadow-[0_0_30px_rgba(250,204,21,0.8)]";
        break;
      case "wake_word_detected":
        animation = "animate-wavy-line-rapid";
        glow = "shadow-[0_0_40px_rgba(239,68,68,0.9)]";
        break;
      case "listening":
        animation = "animate-wavy-line";
        glow = "shadow-[0_0_30px_rgba(0,240,255,0.8)]";
        break;
      default:
        animation = "animate-wavy-line-slow";
        glow = "shadow-[0_0_15px_rgba(107,114,128,0.5)]";
        break;
    }

    return {
      color,
      animation,
      glow
    };
  };

  const wavyLine = getWavyLineStyles();

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center gap-3">
      {/* Wavy Line Indicator */}
      <div className="w-48 h-12 flex items-center justify-center">
        <div 
          className={`relative w-full h-2 overflow-hidden ${wavyLine.glow}`}
          style={{
            filter: `drop-shadow(0 0 5px ${wavyLine.color})`
          }}
        >
          {/* Main wavy line */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 200 10" 
            preserveAspectRatio="none"
          >
            <path
              d="M0,5 Q50,0 100,5 T200,5" 
              fill="none"
              stroke={wavyLine.color}
              strokeWidth="3"
              className={wavyLine.animation}
              style={{
                strokeLinecap: 'round',
                filter: `blur(1px)`
              }}
            />
          </svg>
          
          {/* Subtle glow line */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 200 10" 
            preserveAspectRatio="none"
          >
            <path
              d="M0,5 Q50,0 100,5 T200,5" 
              fill="none"
              stroke={wavyLine.color}
              strokeWidth="1"
              className={`${wavyLine.animation}`}
              style={{
                strokeLinecap: 'round',
                opacity: 0.5,
                animationDuration: `${parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--wavy-line-duration') || '2') * 0.8}s`
              }}
            />
          </svg>
          
          {/* Animated gradient fill */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            style={{
              transform: 'translateX(-100%)',
              animation: `shine 1.5s infinite linear`,
              animationDelay: '0.3s'
            }}
          ></div>
        </div>
      </div>
      
      {/* Status Info */}
      <div className="bg-black/80 border border-holo-cyan/40 p-3 rounded-lg backdrop-blur-sm shadow-[0_0_20px_rgba(0,240,255,0.3)]">
        <div className="flex flex-col items-center text-center">
          <div className="text-xs uppercase tracking-widest text-gray-400">语音识别</div>
          <div 
            className="text-sm font-bold animate-blink-slow"
            style={{ color: wavyLine.color }}
          >
            {getStatusText()}
          </div>
          {state.lastCommand && (
            <div className="text-xs text-gray-500 mt-1 font-mono truncate max-w-[200px]">
              "{state.lastCommand}"
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        {state.isProcessing && (
          <div className="mt-2 w-full h-1 bg-gray-800 rounded overflow-hidden">
            <div 
              className="h-full animate-pulse w-full"
              style={{ background: wavyLine.color }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

const FileTreeWidget = () => (
  <div className="flex flex-col gap-1 text-xs font-mono text-holo-cyan opacity-80 mt-4 border-l-2 border-holo-cyan/30 pl-3 py-2 relative">
    {/* Decorator Line Dots */}
    <div className="absolute -left-[5px] top-0 w-2 h-2 bg-holo-cyan rounded-full"></div>
    <div className="absolute -left-[5px] bottom-0 w-2 h-2 bg-holo-cyan rounded-full"></div>
    
    <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
      <span className="w-1.5 h-1.5 bg-holo-cyan rounded-full"></span>
      <span>RainMeter</span>
    </div>
    <div className="flex items-center gap-2 pl-4 cursor-pointer hover:text-white transition-colors">
       <span className="text-[8px]">▶</span> Resources
    </div>
    <div className="flex items-center gap-2 pl-8 cursor-pointer hover:text-white transition-colors">
       <span className="text-[8px]">▶</span> Browser
    </div>
    <div className="flex items-center gap-2 pl-8 cursor-pointer hover:text-white transition-colors">
       <span className="text-[8px]">▶</span> Themes
    </div>
    <div className="flex items-center gap-2 mt-2 cursor-pointer hover:text-white transition-colors">
      <span className="w-1.5 h-1.5 bg-alert-red rounded-full animate-pulse"></span>
      <span className="text-alert-red">Emergency</span>
    </div>
  </div>
);

const VisualsFrame = () => (
  <div className="relative w-48 border border-holo-cyan/40 p-1 bg-black/20 backdrop-blur-sm">
    {/* Corner Accents */}
    <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-holo-cyan"></div>
    <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-holo-cyan"></div>
    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-holo-cyan"></div>
    
    <div className="flex justify-between items-center mb-1 px-1">
       <span className="text-[8px] uppercase text-holo-cyan tracking-widest">Visuals</span>
       <div className="flex gap-0.5">
          <div className="w-1 h-1 bg-holo-cyan"></div>
          <div className="w-1 h-1 bg-holo-cyan/50"></div>
       </div>
    </div>
    {/* Placeholder Image Grid */}
    <div className="h-24 w-full bg-[linear-gradient(45deg,transparent_25%,rgba(0,240,255,0.1)_25%,rgba(0,240,255,0.1)_50%,transparent_50%,transparent_75%,rgba(0,240,255,0.1)_75%,rgba(0,240,255,0.1)_100%)] bg-[length:10px_10px] border border-white/10 flex items-center justify-center">
       <span className="text-[8px] text-white/50 animate-pulse">STANDBY</span>
    </div>
  </div>
);

const ArcReactorWidget = () => (
  <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Outer Thick Ring */}
      <div className="absolute inset-0 border-4 border-holo-cyan/20 rounded-full"></div>
      {/* Middle Rotating Ring */}
      <div className="absolute inset-2 border-[6px] border-transparent border-t-holo-cyan/40 border-l-holo-cyan/40 rounded-full animate-spin-slow"></div>
      {/* Inner Fast Ring */}
      <div className="absolute inset-8 border-2 border-dashed border-white/30 rounded-full animate-spin-reverse-slow"></div>
      {/* Center Core */}
      <div className="absolute w-12 h-12 bg-holo-cyan/10 rounded-full border border-holo-cyan flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
          <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
      </div>
  </div>
);

const FeedList = () => {
    const items = ["gmail", "wikipedia", "da-rainmeter", "lifehacker", "gizmodo", "kotaku", "twitter"];
    return (
        <div className="text-right space-y-1">
            {items.map((item, i) => (
                <div key={item} className="flex items-center justify-end gap-2 text-[10px] font-mono text-holo-cyan/70 hover:text-holo-cyan hover:scale-105 transition-all cursor-pointer group">
                    <span className="uppercase tracking-wider">{item}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-holo-cyan shadow-[0_0_5px_#00F0FF]' : 'bg-gray-600 group-hover:bg-holo-cyan'}`}></div>
                </div>
            ))}
        </div>
    )
}


const HUDOverlay: React.FC<HUDOverlayProps> = ({ handTrackingRef, currentRegion, voiceRecognitionState, showMechaModel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // UI State for Floating Panel
  const [showIntelPanel, setShowIntelPanel] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  
  const [hexDump, setHexDump] = useState<string[]>([]);
  const [time, setTime] = useState('');
  
  // System Resource Monitoring
  const [systemStats, setSystemStats] = useState({
    cpuUsage: '0%',
    memoryUsage: '0%',
    networkStatus: 'ONLINE',
    batteryLevel: '100%',
    powerOutput: '72%',
    armorIntegrity: '99%',
    targetingAccuracy: '97%'
  });
  
  // Notification System
  const [notifications, setNotifications] = useState<Array<{id: number, message: string, type: 'info' | 'warning' | 'error'}>>([]);
  const notificationIdRef = useRef(0);
  
  const reticleRotationRef = useRef(0);
  const wasPinchingRef = useRef(false);
  
  // Eye Tracking Simulation
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const eyePosRef = useRef({ x: 0, y: 0 });
  const eyeSmoothingRef = useRef(0.15); // Smoothing factor for eye movement
  
  // Mecha Mode Specific State
  const [mechaSystemStatus, setMechaSystemStatus] = useState({
    reactorTemp: '245°C',
    thrusterStatus: 'ONLINE',
    weaponsSystem: 'STANDBY',
    flightMode: 'OFF',
    shieldsStatus: 'ACTIVE',
    targetingSystem: 'LOCKED'
  });
  
  // Simulate eye movement when mecha panel is active
  useEffect(() => {
    if (!showMechaModel) {
      // Reset to center when mecha panel is closed
      setEyePosition({ x: 0, y: 0 });
      eyePosRef.current = { x: 0, y: 0 };
      return;
    }
    
    // Simulate eye movement with randomness and smooth transitions
    const simulateEyeMovement = () => {
      if (!showMechaModel) return;
      
      // Generate random eye movement within a reasonable range (-0.5 to 0.5)
      const targetX = (Math.random() - 0.5) * 0.5;
      const targetY = (Math.random() - 0.5) * 0.5;
      
      // Update eye position with smoothing
      eyePosRef.current.x += (targetX - eyePosRef.current.x) * eyeSmoothingRef.current;
      eyePosRef.current.y += (targetY - eyePosRef.current.y) * eyeSmoothingRef.current;
      
      setEyePosition({ ...eyePosRef.current });
      
      // Schedule next movement update
      const nextDelay = 500 + Math.random() * 1500; // Random delay between 500ms and 2000ms
      setTimeout(simulateEyeMovement, nextDelay);
    };
    
    // Start eye movement simulation
    simulateEyeMovement();
    
    // Cleanup
    return () => {
      // No need for cleanup since we're using setTimeout and checking showMechaModel
    };
  }, [showMechaModel]);

  // Hex Dump & Time Effect
  useEffect(() => {
    const interval = setInterval(() => {
      const chars = '0123456789ABCDEF';
      const line = '0x' + Array(8).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
      setHexDump(prev => [line, ...prev.slice(0, 12)]);
    }, 80);
    
    const timeInterval = setInterval(() => {
        const now = new Date();
        setTime(now.toLocaleTimeString('zh-CN', { hour12: false }) + `.${now.getMilliseconds().toString().padStart(3, '0')}`);
    }, 50);
    
    // System Stats Update Interval
    const statsInterval = setInterval(() => {
        // Simulate system stats (in a real system, these would come from actual system APIs)
        setSystemStats({
            cpuUsage: `${Math.floor(Math.random() * 20 + 5)}%`,
            memoryUsage: `${Math.floor(Math.random() * 30 + 40)}%`,
            networkStatus: Math.random() > 0.95 ? 'OFFLINE' : 'ONLINE',
            batteryLevel: `${Math.floor(Math.random() * 10 + 90)}%`,
            powerOutput: `${Math.floor(Math.random() * 30 + 60)}%`,
            armorIntegrity: `${Math.floor(Math.random() * 5 + 95)}%`,
            targetingAccuracy: `${Math.floor(Math.random() * 10 + 90)}%`
        });
        
        // Update mecha system status
        setMechaSystemStatus({
            reactorTemp: `${Math.floor(Math.random() * 50 + 220)}°C`,
            thrusterStatus: Math.random() > 0.95 ? 'MAINTENANCE' : 'ONLINE',
            weaponsSystem: Math.random() > 0.9 ? 'READY' : 'STANDBY',
            flightMode: Math.random() > 0.7 ? 'ON' : 'OFF',
            shieldsStatus: Math.random() > 0.9 ? 'DOWN' : 'ACTIVE',
            targetingSystem: Math.random() > 0.8 ? 'LOCKED' : 'SEARCHING'
        });
    }, 2000);

    return () => {
        clearInterval(interval);
        clearInterval(timeInterval);
        clearInterval(statsInterval);
    }
  }, []);
  
  // Add notification
  const addNotification = (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const id = notificationIdRef.current++;
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };
  
  // Enhanced voice recognition status handling
  useEffect(() => {
    if (voiceRecognitionState.status === 'wake_word_detected') {
        addNotification('贾维斯已唤醒', 'info');
    } else if (voiceRecognitionState.status === 'recognizing') {
        addNotification('正在识别语音指令', 'info');
    }
  }, [voiceRecognitionState.status]);
  
  // Enhanced gesture handling for notifications
  useEffect(() => {
    const hands = handTrackingRef.current;
    if (hands.rightHand && hands.rightHand.gesture) {
        switch (hands.rightHand.gesture) {
            case 'thumb_up':
                addNotification('操作已确认', 'info');
                break;
            case 'thumb_down':
                addNotification('操作已取消', 'warning');
                break;
            case 'closed_fist':
                addNotification('系统已锁定', 'info');
                break;
        }
    }
  }, [handTrackingRef]);

  // Canvas Drawing Loop (Hand Skeletal & Effects)
  useEffect(() => {
    const renderFrame = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const hands = handTrackingRef.current;
      
      reticleRotationRef.current += 0.05;

      // --- HAND RENDERING ---
      [hands.leftHand, hands.rightHand].forEach(hand => {
        if (hand) {
          const isRight = hand.handedness === 'Right';
          const mainColor = isRight ? '#00F0FF' : '#00A3FF';
          
          // Skeleton
          ctx.strokeStyle = mainColor;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          
          const connections = [[0,1],[1,2],[2,3],[3,4], [0,5],[5,6],[6,7],[7,8], [5,9],[9,10],[10,11],[11,12], [9,13],[13,14],[14,15],[15,16], [13,17],[17,18],[18,19],[19,20], [0,17]];
          
          connections.forEach(([start, end]) => {
            const p1 = hand.landmarks[start];
            const p2 = hand.landmarks[end];
            ctx.moveTo((1 - p1.x) * canvas.width, p1.y * canvas.height);
            ctx.lineTo((1 - p2.x) * canvas.width, p2.y * canvas.height);
          });
          ctx.stroke();
          ctx.setLineDash([]);

          // Joints
          hand.landmarks.forEach((lm, index) => {
            const x = (1 - lm.x) * canvas.width;
            const y = lm.y * canvas.height;
            
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            if ([4, 8, 12, 16, 20].includes(index)) {
                ctx.beginPath();
                ctx.arc(x, y, 8, reticleRotationRef.current, reticleRotationRef.current + Math.PI);
                ctx.strokeStyle = isRight ? '#FF2A2A' : '#00F0FF';
                ctx.stroke();
            }
          });
          
          // Palm Info
          const palmX = (1 - hand.landmarks[0].x) * canvas.width;
          const palmY = hand.landmarks[0].y * canvas.height;
          
          ctx.beginPath();
          ctx.arc(palmX, palmY, 20, -reticleRotationRef.current, -reticleRotationRef.current + Math.PI * 1.5);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.stroke();
          
          ctx.font = '10px Rajdhani';
          ctx.fillStyle = mainColor;
          const label = isRight ? 'ID: 右手-01' : 'ID: 左手-02';
          ctx.fillText(label, palmX + 25, palmY);
        }
      });

      // --- LEFT HAND: EXPANSION GAUGE ---
      if (hands.leftHand) {
          const wrist = hands.leftHand.landmarks[0];
          const gaugeX = (1 - wrist.x) * canvas.width - 100;
          const gaugeY = wrist.y * canvas.height;

          const exp = hands.leftHand.expansionFactor;
          const isMaxed = exp > 0.95;
          const gaugeColor = isMaxed ? '#FF2A2A' : '#00F0FF';

          // Gauge Background
          ctx.beginPath();
          ctx.arc(gaugeX, gaugeY, 40, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 47, 167, 0.5)';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Active Gauge Value
          ctx.beginPath();
          // Map 0-1 to angle
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + (exp * Math.PI * 2);
          ctx.arc(gaugeX, gaugeY, 40, startAngle, endAngle);
          ctx.strokeStyle = gaugeColor;
          ctx.lineWidth = isMaxed ? 6 : 4; // Thicker when maxed
          if (isMaxed) {
              ctx.shadowColor = '#FF2A2A';
              ctx.shadowBlur = 15;
          } else {
              ctx.shadowBlur = 0;
          }
          ctx.stroke();
          ctx.shadowBlur = 0; // Reset

          // Text
          ctx.fillStyle = gaugeColor;
          ctx.font = isMaxed ? 'bold 14px "Orbitron"' : 'bold 12px "Orbitron"';
          ctx.textAlign = 'center';
          ctx.fillText(isMaxed ? "最大输出" : "解除限制", gaugeX, gaugeY - 10);
          ctx.fillText(`${Math.round(exp * 100)}%`, gaugeX, gaugeY + 15);
          ctx.textAlign = 'left'; // Reset
          
          // Connecting line
          ctx.beginPath();
          ctx.moveTo((1 - wrist.x) * canvas.width - 25, wrist.y * canvas.height);
          ctx.lineTo(gaugeX + 45, gaugeY);
          ctx.strokeStyle = isMaxed ? 'rgba(255, 42, 42, 0.5)' : 'rgba(0, 240, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
      }

      // --- RIGHT HAND: PINCH TO SHOW INTEL ---
      if (hands.rightHand) {
        const isPinching = hands.rightHand.isPinching;
        
        // Handle State Transition for Sound
        if (isPinching && !wasPinchingRef.current) {
            SoundService.playLock();
            setShowIntelPanel(true);
        } else if (!isPinching && wasPinchingRef.current) {
            SoundService.playRelease();
            setShowIntelPanel(false);
        }
        wasPinchingRef.current = isPinching;

        // Update Panel Position logic
        if (isPinching) {
            const indexTip = hands.rightHand.landmarks[8];
            const cursorX = (1 - indexTip.x) * canvas.width;
            const cursorY = indexTip.y * canvas.height;
            setPanelPos({ x: cursorX + 50, y: cursorY - 100 });
            
            // Connector Line from Hand to Panel
            ctx.beginPath();
            ctx.moveTo(cursorX, cursorY);
            ctx.lineTo(cursorX + 50, cursorY - 100); // Connects to top-left of where panel div renders
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Draw Pinch Reticle
        if (isPinching) {
             const indexTip = hands.rightHand.landmarks[8];
             const thumbTip = hands.rightHand.landmarks[4];
             const midX = ((1 - indexTip.x) * canvas.width + (1 - thumbTip.x) * canvas.width) / 2;
             const midY = (indexTip.y * canvas.height + thumbTip.y * canvas.height) / 2;
             
             ctx.beginPath();
             ctx.arc(midX, midY, 15, 0, Math.PI * 2);
             ctx.strokeStyle = '#FF2A2A';
             ctx.lineWidth = 2;
             ctx.stroke();
             
             ctx.beginPath();
             ctx.arc(midX, midY, 5, 0, Math.PI * 2);
             ctx.fillStyle = '#FF2A2A';
             ctx.fill();
        }
      } else {
          // If hand lost, hide panel
          if (showIntelPanel) setShowIntelPanel(false);
          wasPinchingRef.current = false;
      }

      requestRef.current = requestAnimationFrame(renderFrame);
    };

    requestRef.current = requestAnimationFrame(renderFrame);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [handTrackingRef, showIntelPanel]);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden font-sans text-holo-cyan select-none">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-20" />
      <div className="vignette"></div>
      <div className="scanlines z-10 opacity-50"></div>
      
      {/* Mecha Mode Targeting Grid */}
      {showMechaModel && <TargetingGrid />}

      {/* --- TOP HEADER --- */}
      
      {/* Top Left: System Status */}
      <div className="absolute top-8 left-8 z-30 flex flex-col gap-2 animate-pulse-fast">
        <div className={`border-l-4 border-holo-cyan pl-4 bg-black/40 p-2 backdrop-blur-sm rounded-r-lg shadow-[0_0_15px_rgba(0,240,255,0.3)] ${showMechaModel ? 'scale-110 bg-black/60 shadow-[0_0_30px_rgba(0,240,255,0.5)]' : ''}`}>
          <h2 className="text-xl font-display font-bold text-white tracking-widest">斯塔克工业</h2>
          <div className="h-[1px] w-32 bg-holo-cyan my-1"></div>
          <div className="text-xs text-holo-blue font-mono opacity-80">MARK VII HUD 固件 V8.0.3</div>
        </div>
        
        {/* Mecha Mode Enhanced Display */}
        {showMechaModel && (
          <div className="bg-black/80 border border-holo-cyan/40 p-3 rounded-lg backdrop-blur-md shadow-[0_0_25px_rgba(0,240,255,0.4)]">
            <div className="text-[10px] uppercase tracking-widest text-holo-cyan mb-2">机甲状态概览</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">能量输出</div>
                <div className="text-xl font-display font-bold text-holo-blue drop-shadow-[0_0_5px_rgba(0,163,255,0.8)]">{systemStats.powerOutput}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">瞄准精度</div>
                <div className="text-xl font-display font-bold text-holo-cyan drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">{systemStats.targetingAccuracy}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">装甲完整度</div>
                <div className="text-xl font-display font-bold text-holo-green drop-shadow-[0_0_5px_rgba(0,255,128,0.8)]">{systemStats.armorIntegrity}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className={`font-mono text-[10px] text-klein-blue opacity-60 leading-tight h-24 overflow-hidden ${showMechaModel ? 'hidden' : ''}`}>
          {hexDump.map((line, i) => <div key={i}>{line}</div>)}
        </div>
        
        {/* System Resource Monitor */}
        <div className={`bg-black/60 border-l border-t border-holo-cyan p-2 rounded-tr-lg backdrop-blur-md w-72 ${showMechaModel ? 'hidden' : ''}`}>
          <div className="text-[10px] uppercase tracking-widest text-holo-cyan mb-2">系统资源监控</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>CPU 使用率</span>
                <span className="text-holo-cyan">{systemStats.cpuUsage}</span>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-holo-cyan" style={{width: systemStats.cpuUsage}}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>内存占用</span>
                <span className="text-holo-cyan">{systemStats.memoryUsage}</span>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-holo-cyan" style={{width: systemStats.memoryUsage}}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>网络状态</span>
                <span className={`${systemStats.networkStatus === 'ONLINE' ? 'text-holo-cyan' : 'text-alert-red'}`}>{systemStats.networkStatus}</span>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded overflow-hidden">
                <div className={`h-full ${systemStats.networkStatus === 'ONLINE' ? 'bg-holo-cyan' : 'bg-alert-red'}`} style={{width: systemStats.networkStatus === 'ONLINE' ? '100%' : '0%'}}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-gray-400">
                <span>电量水平</span>
                <span className="text-holo-cyan">{systemStats.batteryLevel}</span>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-holo-cyan" style={{width: systemStats.batteryLevel}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notification System */}
      <div className="absolute top-8 right-1/2 transform translate-x-1/2 z-40 flex flex-col gap-2 max-w-md">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`p-3 rounded-lg backdrop-blur-md animate-slide-down ${notification.type === 'info' ? 'bg-holo-cyan/20 border border-holo-cyan text-holo-cyan' : 
                                                                          notification.type === 'warning' ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-500' : 
                                                                          'bg-alert-red/20 border border-alert-red text-alert-red'} ${showMechaModel ? 'bg-black/80 scale-110 shadow-[0_0_20px_rgba(0,240,255,0.3)]' : ''}`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${notification.type === 'info' ? 'bg-holo-cyan animate-pulse' : 
                                                       notification.type === 'warning' ? 'bg-yellow-500 animate-pulse' : 
                                                       'bg-alert-red animate-pulse'}`}></div>
              <span className="text-xs font-mono">{notification.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Right: Title & Clock */}
      <div className="absolute top-8 right-8 z-30 text-right">
        <h1 className={`text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-holo-blue drop-shadow-[0_0_15px_rgba(0,240,255,0.9)] tracking-tighter ${showMechaModel ? 'text-8xl drop-shadow-[0_0_25px_rgba(0,240,255,1)]' : ''}`}>
          J.A.R.V.I.S.
        </h1>
        <div className={`text-2xl font-mono text-holo-cyan mt-[-5px] tracking-widest flex justify-end items-center gap-4 ${showMechaModel ? 'text-3xl gap-6' : ''}`}>
            <span className="animate-blink text-alert-red text-xs border border-alert-red px-2 py-0.5 rounded bg-alert-red/10">实时画面</span>
            {time}
        </div>
      </div>


      {/* --- MECHA MODE ENHANCED PANELS --- */}
      {showMechaModel && (
        <>
          {/* Left Center: Armor Integrity */}
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 z-30">
            <ArmorIntegrityDisplay integrity={systemStats.armorIntegrity} />
          </div>
          
          {/* Right Center: Mecha System Status */}
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2 z-30">
            <MechaStatusPanel status={mechaSystemStatus} />
          </div>
          
          {/* Top Center: Tactical Information - Moved to top of screen */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-transparent border-none p-2 backdrop-blur-sm shadow-none">
            <div className="text-xs uppercase tracking-widest text-holo-cyan/90 mb-1 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-holo-cyan animate-pulse"></div>
              战术信息
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-[9px] text-gray-300/70 uppercase mb-0.5">锁定目标</div>
                <div className="text-xl font-display font-bold text-alert-red/90 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)] animate-pulse">
                  {Math.floor(Math.random() * 5) + 1}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-gray-300/70 uppercase mb-0.5">距离</div>
                <div className="text-xl font-display font-bold text-holo-cyan/90 drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]">
                  {Math.floor(Math.random() * 5000) + 1000}m
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-gray-300/70 uppercase mb-0.5">速度</div>
                <div className="text-xl font-display font-bold text-holo-blue/90 drop-shadow-[0_0_6px_rgba(0,163,255,0.5)]">
                  {Math.floor(Math.random() * 300) + 100}km/h
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Left: Power Gauges */}
          <div className="absolute bottom-16 left-8 z-30 flex gap-8">
            <CircularGauge label="能量核心" value={systemStats.powerOutput} color="text-holo-blue" mechaMode={true} />
            <CircularGauge label="反应堆" value={mechaSystemStatus.reactorTemp} color="text-alert-red" mechaMode={true} />
            <CircularGauge label="护盾强度" value="87%" color="text-holo-cyan" mechaMode={true} />
          </div>
          
          {/* Bottom Right: Enhanced Weapons & Flight Status */}
          <div className="absolute bottom-16 right-8 z-30 bg-black/80 border border-holo-cyan/40 p-4 rounded-lg backdrop-blur-sm shadow-[0_0_30px_rgba(0,240,255,0.5)] bg-[linear-gradient(45deg,transparent_25%,rgba(0,240,255,0.05)_25%,rgba(0,240,255,0.05)_50%,transparent_50%,transparent_75%,rgba(0,240,255,0.05)_75%,rgba(0,240,255,0.05)_100%)] bg-[length:20px_20px]">
            <div className="text-xs uppercase tracking-widest text-holo-cyan mb-3 border-b border-holo-cyan/30 pb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-holo-cyan animate-pulse"></div>
              战斗系统
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase text-gray-400">
                  <span>武器系统</span>
                  <span className={`font-mono text-sm ${mechaSystemStatus.weaponsSystem === 'READY' ? 'text-alert-red animate-pulse' : 'text-holo-cyan'}`}>
                    {mechaSystemStatus.weaponsSystem}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-sm overflow-hidden border border-holo-cyan/20">
                  <div 
                    className={`h-full ${mechaSystemStatus.weaponsSystem === 'READY' ? 'bg-alert-red animate-pulse' : 'bg-holo-cyan'}`} 
                    style={{ width: mechaSystemStatus.weaponsSystem === 'READY' ? '100%' : '30%' }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase text-gray-400">
                  <span>飞行模式</span>
                  <span className={`font-mono text-sm ${mechaSystemStatus.flightMode === 'ON' ? 'text-holo-blue animate-pulse' : 'text-gray-500'}`}>
                    {mechaSystemStatus.flightMode}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-sm overflow-hidden border border-holo-cyan/20">
                  <div 
                    className={`h-full ${mechaSystemStatus.flightMode === 'ON' ? 'bg-holo-blue animate-pulse' : 'bg-gray-600'}`} 
                    style={{ width: mechaSystemStatus.flightMode === 'ON' ? '100%' : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase text-gray-400">
                  <span>护盾状态</span>
                  <span className={`font-mono text-sm ${mechaSystemStatus.shieldsStatus === 'ACTIVE' ? 'text-holo-cyan animate-pulse' : 'text-alert-red'}`}>
                    {mechaSystemStatus.shieldsStatus}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-sm overflow-hidden border border-holo-cyan/20">
                  <div 
                    className={`h-full ${mechaSystemStatus.shieldsStatus === 'ACTIVE' ? 'bg-holo-cyan animate-pulse' : 'bg-alert-red'}`} 
                    style={{ width: mechaSystemStatus.shieldsStatus === 'ACTIVE' ? '100%' : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase text-gray-400">
                  <span>瞄准系统</span>
                  <span className={`font-mono text-sm ${mechaSystemStatus.targetingSystem === 'LOCKED' ? 'text-alert-red animate-pulse' : 'text-holo-cyan'}`}>
                    {mechaSystemStatus.targetingSystem}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-sm overflow-hidden border border-holo-cyan/20">
                  <div 
                    className={`h-full ${mechaSystemStatus.targetingSystem === 'LOCKED' ? 'bg-alert-red animate-pulse' : 'bg-holo-cyan'}`} 
                    style={{ width: mechaSystemStatus.targetingSystem === 'LOCKED' ? '100%' : '80%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- NON-MECHA MODE PANELS --- */}
      {!showMechaModel && (
        <>
          {/* --- LEFT SIDE PANELS --- */}
          
          {/* Left Panel 1: Power/Storage Gauge */}
          <div className="absolute left-16 top-1/3 transform -translate-y-1/2 z-30 flex flex-col gap-8">
             <CircularGauge label="Primary Storage" value="74%" />
             <CircularGauge label="Power Cells" value="98%" color="text-holo-blue" />
          </div>

          {/* Left Panel 2: File Explorer (Bottom Left) */}
          <div className="absolute bottom-32 left-8 z-30">
               <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Directory</div>
               <FileTreeWidget />
               
               {/* Status Widget below tree */}
               <div className="mt-8 bg-black/60 border-t border-l border-holo-blue p-4 rounded-tr-xl backdrop-blur-md w-64 relative">
                    <div className="absolute top-0 right-0 w-2 h-2 bg-holo-cyan shadow-[0_0_10px_#00F0FF]"></div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-700 pb-1">生物识别输入</div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-holo-cyan text-sm font-bold">左手操控模组</span>
                            <span className={`text-xs px-2 rounded ${handTrackingRef.current.leftHand ? 'bg-holo-cyan text-black' : 'bg-red-900/50 text-red-500'}`}>
                                 {handTrackingRef.current.leftHand ? '在线' : '离线'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-holo-cyan text-sm font-bold">右手交互模组</span>
                            <span className={`text-xs px-2 rounded ${handTrackingRef.current.rightHand ? 'bg-holo-cyan text-black' : 'bg-red-900/50 text-red-500'}`}>
                                 {handTrackingRef.current.rightHand ? '在线' : '离线'}
                            </span>
                        </div>
                    </div>
               </div>
          </div>

          {/* --- RIGHT SIDE PANELS --- */}
          
          {/* Right Panel 1: Visuals Frame (Top Right, below title) */}
          <div className="absolute right-10 top-40 z-30">
              <VisualsFrame />
          </div>

          {/* Right Panel 2: Arc Reactor / Compass (Middle Right) */}
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2 z-30">
               <div className="flex flex-col items-center gap-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-holo-cyan/70 border-b border-holo-cyan/30 pb-1 w-full text-center">Atmosphere</div>
                    <ArcReactorWidget />
                    <div className="flex justify-between w-full px-2 text-[8px] font-mono text-holo-cyan/50">
                        <span>O2: 98%</span>
                        <span>TEMP: 24°C</span>
                    </div>
               </div>
          </div>

          {/* Right Panel 3: Data Feed (Bottom Right) */}
          <div className="absolute bottom-32 right-8 z-30 flex flex-col items-end gap-2">
               <div className="text-[10px] uppercase tracking-widest text-holo-blue border-b-2 border-holo-blue/30 pb-1 mb-2 pr-4">Communication Feed</div>
               <FeedList />
               <div className="mt-4 w-48 h-1 bg-gray-800 rounded overflow-hidden">
                    <div className="h-full bg-holo-cyan/50 animate-pulse w-[60%]"></div>
               </div>
          </div>
        </>
      )}

      {/* --- INTERACTIVE FLOATING PANEL (PINCH) --- */}
      {showIntelPanel && (
          <div 
            className="absolute z-40 animate-flash origin-top-left"
            style={{ 
                left: panelPos.x,
                top: panelPos.y,
                width: '300px'
            }}
          >
            <div className="bg-black/80 border-l-2 border-alert-red shadow-[0_0_40px_rgba(255,42,42,0.3)] backdrop-blur-xl p-1 rounded-r-lg">
                <div className="flex justify-between items-center bg-gradient-to-r from-alert-red/50 to-transparent p-2 mb-2 border-b border-white/10">
                    <span className="font-display font-bold text-sm tracking-widest text-white">GEO_INTEL_LIVE</span>
                    <div className="w-2 h-2 bg-alert-red rounded-full animate-ping"></div>
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="text-xs text-holo-blue uppercase">目标区域</div>
                        <div className="text-2xl font-display text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                            {currentRegion}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase text-gray-400">
                                <span>信号强度</span>
                                <span>98%</span>
                            </div>
                            <div className="w-full bg-gray-900 h-1.5 overflow-hidden rounded-sm">
                                <div className="bg-holo-cyan h-full w-[98%] shadow-[0_0_10px_#00F0FF] relative">
                                    <div className="absolute top-0 left-0 h-full w-full bg-white/30 animate-[scanline_1s_linear_infinite]"></div>
                                </div>
                            </div>
                        </div>
                        
                         <div className="grid grid-cols-2 gap-2 mt-2">
                             <div className="bg-white/5 p-1 text-center border border-white/10">
                                 <div className="text-[8px] text-gray-400">经度</div>
                                 <div className="font-mono text-xs text-holo-cyan">116.4074</div>
                             </div>
                             <div className="bg-white/5 p-1 text-center border border-white/10">
                                 <div className="text-[8px] text-gray-400">纬度</div>
                                 <div className="font-mono text-xs text-holo-cyan">39.9042</div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
            {/* Decorator Lines */}
            <svg className="absolute -left-4 top-0 w-4 h-full overflow-visible">
                 <path d="M 4,0 L 0,10 L 0,150" fill="none" stroke="#FF2A2A" strokeWidth="1" />
            </svg>
          </div>
      )}
      
      {/* Right Eye Tracker - Show only when Mecha Panel is active */}
      {showMechaModel && <RightEyeTracker eyePos={eyePosition} />}
      
      {/* Voice Recognition Status Indicator */}
      <VoiceRecognitionIndicator state={voiceRecognitionState} />
      
    </div>
  );
};

export default HUDOverlay;