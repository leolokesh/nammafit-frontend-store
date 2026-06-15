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
        <div className="px-4 py-2 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/10 text-[11px] font-bold text-[#B0E4CC] tracking-wider uppercase shadow-xl flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B0E4CC] animate-pulse" />
          {type === "front" ? "Align Front Profile" : "Align Side Profile"}
        </div>
      </div>

      {/* SVG Outline Overlay */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0 relative my-4">
        {type === "front" ? (
          // Front body outline overlay
          <svg
            className="w-full max-w-[340px] h-full max-h-[82%] opacity-65 text-[#B0E4CC]/40 drop-shadow-[0_0_15px_rgba(176,228,204,0.15)] transition-all duration-500"
            viewBox="0 0 400 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Symmetrical front outline */}
            <path
              d="
                M 200,60 
                C 175,60 170,90 170,110 
                C 170,125 180,135 180,140
                C 170,143 145,152 135,160 
                C 120,172 110,195 110,215
                C 110,230 115,280 110,310
                C 105,330 95,350 90,370
                C 85,385 95,395 105,395
                C 115,395 125,370 128,340
                C 132,305 138,275 142,240
                C 142,270 145,300 148,340
                C 152,380 155,420 152,470
                C 149,510 142,545 138,565
                C 135,575 142,580 152,580
                C 165,580 175,540 182,490
                C 188,445 195,400 200,380
                C 205,400 212,445 218,490
                C 225,540 235,580 248,580
                C 258,580 265,575 262,565
                C 258,545 251,510 248,470
                C 245,420 248,380 252,340
                C 255,300 258,270 258,240
                C 262,275 268,305 272,340
                C 275,370 285,395 295,395
                C 305,395 315,385 310,370
                C 305,350 295,330 290,310
                C 285,280 290,230 290,215
                C 290,195 280,172 265,160
                C 255,152 230,143 220,140
                C 220,135 230,125 230,110
                C 230,90 225,60 200,60
                Z
              "
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            {/* Guide markers */}
            <circle cx="200" cy="100" r="15" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <line x1="200" y1="20" x2="200" y2="580" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.2" />
            <line x1="50" y1="380" x2="350" y2="380" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.2" />
          </svg>
        ) : (
          // Side profile outline overlay
          <svg
            className="w-full max-w-[280px] h-full max-h-[82%] opacity-65 text-[#B0E4CC]/40 drop-shadow-[0_0_15px_rgba(176,228,204,0.15)] transition-all duration-500"
            viewBox="0 0 300 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Posture profile facing right */}
            <path
              d="
                M 140,60
                C 120,60 115,85 115,100
                C 115,115 125,125 130,130
                C 120,135 110,145 105,160
                C 98,180 98,200 102,230
                C 105,250 115,280 118,310
                C 122,340 120,370 115,400
                C 110,430 105,470 110,510
                C 112,530 115,550 120,570
                C 123,578 132,580 138,580
                C 145,580 152,572 150,560
                C 145,530 142,500 145,460
                C 148,420 152,380 158,340
                C 162,310 168,280 168,250
                C 168,220 162,190 158,160
                C 155,145 150,135 145,130
                C 148,125 152,118 152,100
                C 152,85 150,60 140,60
                Z
              "
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            {/* Guide markers */}
            <circle cx="135" cy="95" r="15" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <line x1="135" y1="20" x2="135" y2="580" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.2" />
          </svg>
        )}
      </div>

      {/* Alignment tips banner */}
      <div className="w-full flex flex-col items-center gap-1.5 mb-2 text-center">
        <p className="text-[11px] text-slate-300 max-w-[280px] bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 shadow-md">
          {type === "front" 
            ? "Stand straight facing the camera with your arms slightly away from your sides." 
            : "Turn 90° to the side (fully sideways) and stand straight in a neutral posture."}
        </p>
      </div>
    </div>
  );
}
