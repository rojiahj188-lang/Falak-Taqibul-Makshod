import React, { useState } from 'react';

interface KemenagLogoProps {
  className?: string;
  size?: number;
  alt?: string;
}

export const KemenagLogo: React.FC<KemenagLogoProps> = ({
  className = '',
  size = 48,
  alt = 'Logo Resmi'
}) => {
  const [imgSrc, setImgSrc] = useState<string>(
    'https://cdn.phototourl.com/free/2026-09-20-1721e240-afc9-4575-9b9b-13a55b4ba848.png'
  );
  const [hasError, setHasError] = useState<boolean>(false);

  const handleError = () => {
    // If external CDN fails, fallback to local downloaded asset
    if (imgSrc.startsWith('https://')) {
      setImgSrc('/logo-kemenag-custom.png');
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={alt}
      >
        <polygon
          points="100,8 190,42 165,165 100,192 35,165 10,42"
          fill="#0b6330"
          stroke="#FFD700"
          strokeWidth="6"
        />
        <circle cx="100" cy="100" r="45" fill="#108942" stroke="#FFD700" strokeWidth="4" />
        <polygon
          points="100,28 104,39 116,39 106,46 110,57 100,50 90,57 94,46 84,39 96,39"
          fill="#FFD700"
        />
        <text
          x="100"
          y="110"
          fill="#FFFFFF"
          fontSize="20"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          KEMENAG
        </text>
      </svg>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`object-contain inline-block shrink-0 ${className}`}
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
};
