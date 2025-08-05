import React, { ReactElement } from 'react';
import { Box, Skeleton, SxProps, Theme, useTheme } from '@mui/material';
import { animations } from '../../theme/theme';

type SkeletonVariant = 'text' | 'rectangular' | 'circular' | 'card' | 'list' | 'table' | 'dashboard';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  count?: number;
  animation?: 'pulse' | 'wave' | false;
  sx?: SxProps<Theme>;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  animation = 'pulse',
  sx = {},
}) => {
  const theme = useTheme();

  // Base skeleton with animation enhancement
  const BaseSkeleton = (props: any) => (
    <Skeleton
      animation={animation}
      {...props}
      sx={{
        borderRadius: 1,
        '&::after': {
          animation: `${animation === 'wave' ? '1.6s' : '2s'} ease-in-out 0.5s infinite normal none running`,
        },
        ...props.sx,
      }}
    />
  );

  // Generate multiple items
  const renderMultiple = (renderFn: () => ReactElement) => {
    return [...Array(count)].map((_, index) => (
      <Box key={index} sx={{ mb: index < count - 1 ? 1 : 0 }}>
        {renderFn()}
      </Box>
    ));
  };

  // Simple text line
  if (variant === 'text') {
    return (
      <>
        {renderMultiple(() => (
          <BaseSkeleton 
            variant="text" 
            width={width || '100%'} 
            height={height || 20} 
            sx={sx}
          />
        ))}
      </>
    );
  }

  // Simple rectangular shape
  if (variant === 'rectangular') {
    return (
      <>
        {renderMultiple(() => (
          <BaseSkeleton 
            variant="rectangular" 
            width={width || '100%'} 
            height={height || 118} 
            sx={sx}
          />
        ))}
      </>
    );
  }

  // Simple circular shape
  if (variant === 'circular') {
    return (
      <>
        {renderMultiple(() => (
          <BaseSkeleton 
            variant="circular" 
            width={width || 40} 
            height={height || 40} 
            sx={sx}
          />
        ))}
      </>
    );
  }

  // Card skeleton with header and content
  if (variant === 'card') {
    return (
      <>
        {renderMultiple(() => (
          <Box 
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              ...sx 
            }}
          >
            {/* Card header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BaseSkeleton variant="circular" width={40} height={40} />
                <Box sx={{ ml: 1 }}>
                  <BaseSkeleton variant="text" width={120} height={20} />
                  <BaseSkeleton variant="text" width={80} height={16} />
                </Box>
              </Box>
              <BaseSkeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
            </Box>
            
            {/* Card content */}
            <Box sx={{ p: 2 }}>
              <BaseSkeleton variant="rectangular" width="100%" height={height || 150} />
              <Box sx={{ mt: 2 }}>
                <BaseSkeleton variant="text" width="90%" height={16} />
                <BaseSkeleton variant="text" width="70%" height={16} />
                <BaseSkeleton variant="text" width="80%" height={16} />
              </Box>
            </Box>
          </Box>
        ))}
      </>
    );
  }

  // List item skeleton
  if (variant === 'list') {
    return (
      <>
        {renderMultiple(() => (
          <Box sx={{ display: 'flex', alignItems: 'center', py: 1, ...sx }}>
            <BaseSkeleton variant="circular" width={40} height={40} />
            <Box sx={{ ml: 2, flex: 1 }}>
              <BaseSkeleton variant="text" width="60%" height={20} />
              <BaseSkeleton variant="text" width="40%" height={16} />
            </Box>
            <BaseSkeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
          </Box>
        ))}
      </>
    );
  }

  // Table skeleton
  if (variant === 'table') {
    return (
      <Box sx={{ width: '100%', ...sx }}>
        {/* Table header */}
        <Box 
          sx={{ 
            display: 'flex', 
            py: 1.5, 
            px: 2, 
            bgcolor: theme.palette.background.default,
            borderBottom: 1, 
            borderColor: 'divider' 
          }}
        >
          {[...Array(5)].map((_, idx) => (
            <Box key={idx} sx={{ flex: idx === 0 ? 2 : 1, px: 1 }}>
              <BaseSkeleton variant="text" width="80%" height={24} />
            </Box>
          ))}
        </Box>
        
        {/* Table rows */}
        {[...Array(count)].map((_, rowIdx) => (
          <Box 
            key={rowIdx} 
            sx={{ 
              display: 'flex', 
              py: 2, 
              px: 2, 
              borderBottom: 1, 
              borderColor: 'divider' 
            }}
          >
            {[...Array(5)].map((_, colIdx) => (
              <Box key={colIdx} sx={{ flex: colIdx === 0 ? 2 : 1, px: 1 }}>
                <BaseSkeleton 
                  variant={colIdx < 2 ? "text" : "rectangular"} 
                  width={colIdx < 2 ? "80%" : 60} 
                  height={colIdx < 2 ? 24 : 32} 
                  sx={colIdx >= 2 ? { borderRadius: 1 } : {}}
                />
                {colIdx === 0 && (
                  <BaseSkeleton variant="text" width="40%" height={16} />
                )}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  // Dashboard skeleton
  if (variant === 'dashboard') {
    return (
      <Box sx={{ width: '100%', ...sx }}>
        {/* Stats cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {[...Array(4)].map((_, idx) => (
            <Box 
              key={idx} 
              sx={{ 
                flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' },
                borderRadius: 2,
                p: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <BaseSkeleton variant="text" width={80} height={16} />
                  <BaseSkeleton variant="text" width={50} height={30} sx={{ mt: 1 }} />
                </Box>
                <BaseSkeleton variant="circular" width={40} height={40} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <BaseSkeleton variant="rectangular" width="100%" height={4} />
              </Box>
            </Box>
          ))}
        </Box>
        
        {/* Charts */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 3,
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* Main chart */}
          <Box 
            sx={{ 
              flex: 2,
              borderRadius: 2,
              p: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              bgcolor: 'background.paper',
            }}
          >
            <BaseSkeleton variant="text" width={150} height={24} />
            <BaseSkeleton variant="text" width={100} height={16} sx={{ mb: 2 }} />
            <BaseSkeleton variant="rectangular" width="100%" height={300} />
          </Box>
          
          {/* Side chart */}
          <Box 
            sx={{ 
              flex: 1,
              borderRadius: 2,
              p: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              bgcolor: 'background.paper',
            }}
          >
            <BaseSkeleton variant="text" width={150} height={24} />
            <BaseSkeleton variant="text" width={100} height={16} sx={{ mb: 2 }} />
            <BaseSkeleton variant="circular" width="100%" height={300} />
          </Box>
        </Box>
        
        {/* Table */}
        <Box 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ p: 2 }}>
            <BaseSkeleton variant="text" width={150} height={24} />
            <BaseSkeleton variant="text" width={100} height={16} />
          </Box>
          
          <SkeletonLoader variant="table" count={5} />
        </Box>
      </Box>
    );
  }

  // Fallback to text
  return <BaseSkeleton variant="text" width={width} height={height} sx={sx} />;
};

export default SkeletonLoader; 