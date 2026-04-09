
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  isDark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", showText = false, isDark = false }) => {
  // Logo versão Flat (Plana) para evitar estouro de traços e sobreposição
  // Renderizado como imagem para garantir fidelidade visual
  const logoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3C!-- Money Bills (Back Layer) --%3E%3Cpath d='M230 60H430C446.569 60 460 73.4315 460 90V260C460 276.569 446.569 290 430 290H230C213.431 290 200 276.569 200 260V90C200 73.4315 213.431 60 230 60Z' fill='%2385c0a8'/%3E%3Cpath d='M200 100H400C416.569 100 430 113.431 430 130V300C430 316.569 416.569 330 400 330H200C183.431 330 170 316.569 170 300V130C170 113.431 183.431 100 200 100Z' fill='%23509573'/%3E%3C!-- Chat Bubble (Front Layer) --%3E%3Cpath d='M90 150H370C403.137 150 430 176.863 430 210V350C430 383.137 403.137 410 370 410H150L60 470V210C60 176.863 86.8629 150 120 150H90Z' fill='%23f43f5e' stroke='white' stroke-width='10'/%3E%3C!-- Dots --%3E%3Ccircle cx='160' cy='280' r='25' fill='white'/%3E%3Ccircle cx='245' cy='280' r='25' fill='white'/%3E%3Ccircle cx='330' cy='280' r='25' fill='white'/%3E%3C/svg%3E";

  return (
    <div className="flex items-center gap-2 select-none">
      <img 
        src={logoSrc} 
        alt="MeConta Logo" 
        className={`${className} object-contain`}
        style={{ minWidth: '32px', minHeight: '32px' }} // Garante tamanho mínimo
      />
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-extrabold text-xl tracking-tight ${isDark ? 'text-white' : 'text-charcoal-900 dark:text-white'}`}>
            MeConta
          </span>
        </div>
      )}
    </div>
  );
};
