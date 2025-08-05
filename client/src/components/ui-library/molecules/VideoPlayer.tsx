import React from 'react';

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  style?: React.CSSProperties;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  controls = true,
  width = '100%',
  height = 360,
  autoPlay = false,
  loop = false,
  muted = false,
  style = {},
}) => {
  return (
    <video
      src={src}
      poster={poster}
      controls={controls}
      width={typeof width === 'number' ? width : undefined}
      height={typeof height === 'number' ? height : undefined}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      style={{ width, height, borderRadius: 8, ...style }}
      aria-label="Video Player"
    >
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoPlayer; 