/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export function FlagCaboVerde({ className = "w-12 h-8", shadow = true }: { className?: string; shadow?: boolean }) {
  return (
    <svg 
      className={`${className} ${shadow ? 'shadow-md border border-neutral-200/25 rounded-sm' : ''} transition-transform duration-300 hover:scale-105`} 
      viewBox="0 0 17 10" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fundo azul celestial representando o mar e o céu */}
      <rect width="17" height="10" fill="#003893" />
      
      {/* Faixas brancas e vermelha (Caminho do progresso, paz e esforço) */}
      <rect y="5" width="17" height="0.5" fill="white" />
      <rect y="5.5" width="17" height="1" fill="#C60C30" />
      <rect y="6.5" width="17" height="0.5" fill="white" />
      
      {/* Círculo de 10 estrelas douradas representando as 10 ilhas habitadas de Cabo Verde */}
      {Array.from({ length: 10 }).map((_, i) => {
        // Ângulo de rotação para formar o círculo
        const angle = (i * 36) * Math.PI / 180;
        // Posição centralizada em x=4.75, y=6.0
        const cx = 5.2 + 2.0 * Math.cos(angle);
        const cy = 6.0 + 2.0 * Math.sin(angle);
        
        return (
          <polygon
            key={i}
            points="0,-0.42 0.12,-0.13 0.42,-0.13 0.18,0.06 0.26,0.37 0,0.18 -0.26,0.37 -0.18,0.06 -0.42,-0.13 -0.12,-0.13"
            transform={`translate(${cx}, ${cy}) scale(0.7)`}
            fill="#FFD100"
          />
        );
      })}
    </svg>
  );
}

export function EmblemaOficial({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)] animate-pulse-slow" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Círculos concêntricos de luxo */}
        <circle cx="50" cy="50" r="46" stroke="#003893" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="50" cy="50" r="43" stroke="#FFD100" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="40" fill="#001F52" stroke="#FFFFFF" strokeWidth="1.5" />
        
        {/* Faixa central tricolor cabo-verdiana representativa */}
        <rect x="18" y="52" width="64" height="2" fill="#FFFFFF" />
        <rect x="18" y="54" width="64" height="4" fill="#C60C30" />
        <rect x="18" y="58" width="64" height="2" fill="#FFFFFF" />
        
        {/* Antorcha ou monumento da independência em dourado */}
        <g transform="translate(50, 36) scale(0.9)">
          <path d="M -6,15 L -2,-1 L 2,-1 L 6,15 Z" fill="#FFD100" />
          <path d="M -2,-1 C -8,-10 0,-15 0,-15 C 0,-15 8,-10 2,-1 Z" fill="#C60C30" />
          {/* Brilho da estrela */}
          <circle cx="0" cy="15" r="3" fill="#FFFFFF" />
        </g>
        
        {/* Anel de 10 Estrelas de Cabo Verde */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i * 36 - 90) * Math.PI / 180;
          const x = 50 + 31 * Math.cos(angle);
          const y = 50 + 31 * Math.sin(angle);
          return (
            <polygon
              key={i}
              points="0,-3 0.9,-0.9 3.1,-0.9 1.3,0.4 1.9,2.6 0,1.3 -1.9,2.6 -1.3,0.4 -3.1,-0.9 -0.9,-0.9"
              transform={`translate(${x}, ${y}) scale(1.1)`}
              fill="#FFD100"
            />
          );
        })}
        
        {/* Textos solenes com tipografia oficial */}
        <text 
          x="50" 
          y="74" 
          fill="#FFFFFF" 
          fontWeight="800" 
          fontSize="6.5" 
          textAnchor="middle" 
          fontFamily="system-ui" 
          letterSpacing="0.1em"
        >
          REPÚBLICA
        </text>
        <text 
          x="50" 
          y="81" 
          fill="#FFD100" 
          fontWeight="800" 
          fontSize="6" 
          textAnchor="middle" 
          fontFamily="system-ui" 
          letterSpacing="0.2em"
        >
          DE CABO VERDE
        </text>
        <text 
          x="50" 
          y="23" 
          fill="#FFD100" 
          fontWeight="800" 
          fontSize="7" 
          textAnchor="middle" 
          fontFamily="system-ui"
          letterSpacing="0.05em"
        >
          2026
        </text>
      </svg>
    </div>
  );
}
