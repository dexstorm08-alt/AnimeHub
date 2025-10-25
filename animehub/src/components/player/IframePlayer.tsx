import React from 'react';

interface IframePlayerProps {
  src: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  allowFullScreen?: boolean;
  className?: string;
}

export const IframePlayer: React.FC<IframePlayerProps> = ({
  src,
  title = "Video Player",
  width = "100%",
  height = "500px",
  allowFullScreen = true,
  className = ""
}) => {
  // Check if the URL is a 9anime page and needs special handling
  const is9animeUrl = src.includes('9anime.org.lv') || src.includes('hianime.do');
  
  // Check if it's a gogoanime URL (which should be embeddable)
  const isGogoanimeUrl = src.includes('gogoanime.me.uk') || src.includes('gogoanime');
  
  // Check if it's a megaplay URL (which should be embeddable)
  const isMegaplayUrl = src.includes('megaplay.buzz') || src.includes('megaplay');
  
  return (
    <div className={`iframe-player-container ${className}`}>
      {is9animeUrl && !isGogoanimeUrl && !isMegaplayUrl ? (
        <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden aspect-video">
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white p-6">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold mb-2">9anime Player</h3>
              <p className="text-gray-300 mb-4">
                This episode is hosted on 9anime.org.lv
              </p>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">▶️</span>
                Watch on 9anime
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full aspect-video">
        <iframe
          src={src}
          title={title}
          width={width}
          height={height}
          allowFullScreen={allowFullScreen}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="absolute inset-0 w-full h-full rounded-lg shadow-lg"
          style={{
            minHeight: typeof height === 'string' ? height : `${height}px`,
            border: 'none',
            borderRadius: '8px'
          }}
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        />
        </div>
      )}
    </div>
  );
};

export default IframePlayer;
