"use client";

import React from "react";

interface CameraOverlayProps {
  type: "front" | "side";
}

export function CameraOverlay({ type }: CameraOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-20 select-none">
      {/* Top Banner Guide */}
      <div className="w-full flex justify-center mt-2 animate-fade-in">
        <div className="px-4 py-2 rounded-full bg-slate-950/90 backdrop-blur-md border border-[#B0E4CC]/30 text-[11px] font-bold text-[#B0E4CC] tracking-wider uppercase shadow-xl flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B0E4CC] animate-pulse" />
          {type === "front" ? "Align Front Profile" : "Align Side Profile"}
        </div>
      </div>

      {/* SVG Outline Overlay */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0 relative my-2">
        {type === "front" ? (
          // Front body outline overlay (Woman Silhouette, Maximized Sizing)
          <svg
            className="w-full max-w-[460px] h-[95%] max-h-[95%] opacity-95 text-[#B0E4CC] drop-shadow-[0_0_20px_rgba(176,228,204,0.4)] transition-all duration-500"
            viewBox="0 0 400 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Enlarged, stretched female silhouette coordinates for easier alignment */}
            <path
              d="
                M 200,10
                C 155,10 150,45 150,65
                C 150,80 170,85 170,95
                C 170,105 130,112 110,120
                C 80,128 60,140 60,165
                C 60,190 70,220 60,255
                C 50,280 20,325 35,355
                C 42,370 52,380 72,380
                C 92,380 92,360 95,335
                C 98,300 102,265 104,230
                C 104,265 109,300 115,335
                C 120,370 126,415 120,465
                C 112,515 100,555 90,580
                C 86,590 98,595 116,595
                C 140,595 158,550 168,495
                C 178,445 188,400 200,380
                C 212,400 222,445 232,495
                C 242,595 260,595 284,595
                C 302,595 314,590 310,580
                C 300,555 288,515 280,465
                C 274,415 280,370 285,335
                C 291,300 296,265 296,230
                C 298,265 302,300 305,335
                C 308,360 308,380 328,380
                C 348,380 358,370 365,355
                C 380,325 350,280 340,255
                C 330,220 340,190 340,165
                C 340,140 320,128 290,120
                C 270,112 230,105 230,95
                C 230,85 250,80 250,65
                C 250,45 245,10 200,10
                Z
              "
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Horizontal Alignment Guides */}
            <line x1="60" y1="165" x2="340" y2="165" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" /> {/* Shoulders */}
            <line x1="60" y1="255" x2="340" y2="255" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" /> {/* Hips */}
            <line x1="120" y1="465" x2="280" y2="465" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" /> {/* Knees */}

            {/* Vertical Center Axis */}
            <line x1="200" y1="15" x2="200" y2="585" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 6" opacity="0.3" />
          </svg>
        ) : (
          // Symmetrical Simple Side Profile outline overlay (Head Circle + Symmetrical Torso & Legs Column)
          <svg
            className="w-full max-w-[340px] h-[92%] max-h-[92%] opacity-95 text-[#B0E4CC] drop-shadow-[0_0_20px_rgba(176,228,204,0.4)] transition-all duration-500"
            viewBox="0 0 300 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Simple Side Profile Head Circle */}
            <circle cx="150" cy="80" r="42" stroke="currentColor" strokeWidth="5" />
            
            {/* Simple Symmetrical Side Body & Legs column */}
            <path
              d="
                M 135,130
                C 110,140 100,165 100,200
                C 100,240 110,280 110,340
                C 110,400 98,480 104,580
                H 196
                C 202,480 190,400 190,340
                C 190,280 200,240 200,200
                C 200,165 190,140 165,130
                Z
              "
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Vertical Center Axis */}
            <line x1="150" y1="15" x2="150" y2="585" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 6" opacity="0.3" />
          </svg>
        )}
      </div>

      {/* Alignment tips banner */}
      <div className="w-full flex flex-col items-center gap-1.5 mb-2 text-center">
        <p className="text-[11px] text-slate-300 max-w-[320px] bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-md leading-relaxed">
          {type === "front" 
            ? "Position yourself within the center guide and stand straight facing the camera." 
            : "Turn sideways within the guide and stand straight in a neutral posture."}
        </p>
      </div>
    </div>
  );
}
