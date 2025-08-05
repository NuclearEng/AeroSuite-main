import React from 'react';
import { 
  Box, 
  Skeleton, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Paper, 
  useTheme 
} from '@mui/material';

export type SkeletonScreenVariant = 
  | 'table' 
  | 'card' 
  | 'list' 
  | 'grid' 
  | 'detail' 
  | 'form' 
  | 'chart' 
  | 'dashboard' 
  | 'profile' 
  | 'feed';

export interface SkeletonScreenProps {
  /**
   * The type of UI pattern to render a skeleton for
   */
  variant: SkeletonScreenVariant;
  
  /**
   * Number of skeleton items to render (for lists, tables, grids)
   */
  count?: number;
  
  /**
   * Height of the skeleton
   */
  height?: number | string;
  
  /**
   * Width of the skeleton
   */
  width?: number | string;
  
  /**
   * Animation type
   */
  animation?: 'pulse' | 'wave' | false;
  
  /**
   * Additional styling
   */
  sx?: React.CSSProperties;
  
  /**
   * Whether to show the skeleton inside a container
   */
  withContainer?: boolean;
  
  /**
   * Custom configuration for specific variants
   */
  config?: {
    columns?: number;
    rows?: number;
    withHeader?: boolean;
    withActions?: boolean;
    withImage?: boolean;
    withFooter?: boolean;
    spacing?: number;
    dense?: boolean;
  };
}

/**
 * SkeletonScreen component for displaying loading states
 * 
 * This component provides skeleton screens for different UI patterns,
 * helping to improve perceived performance and user experience during loading.
 */
const SkeletonScreen: React.FC<SkeletonScreenProps> = ({
  variant,
  count = 5,
  height,
  width = '100%',
  animation = 'pulse',
  sx = {},
  withContainer = true,
  config = {}
}) => {
  const theme = useTheme();
  
  // Default configuration
  const {
    columns = 3,
    rows = 3,
    withHeader = true,
    withActions = true,
    withImage = true,
    withFooter = true,
    spacing = 2,
    dense = false
  } = config;
  
  // Container component
  const Container = withContainer ? Paper : React.Fragment;
  const containerProps = withContainer ? { 
    elevation: 0,
    variant: 'outlined' as const,
    sx: { p: 2, ...sx }
  } : {};
  
  // Table skeleton
  const renderTableSkeleton = () => (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {withHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rectangular" width={120} height={40} animation={animation} />
            <Skeleton variant="rectangular" width={120} height={40} animation={animation} />
          </Box>
          {withActions && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="rectangular" width={100} height={40} animation={animation} />
              <Skeleton variant="rectangular" width={100} height={40} animation={animation} />
            </Box>
          )}
        </Box>
      )}
      
      {/* Table header */}
      <Box sx={{ display: 'flex', mb: 1 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Box key={i} sx={{ flex: 1, px: 1 }}>
            <Skeleton variant="text" height={24} animation={animation} />
          </Box>
        ))}
        {withActions && (
          <Box sx={{ width: 80 }}>
            <Skeleton variant="text" height={24} animation={animation} />
          </Box>
        )}
      </Box>
      
      {/* Table rows */}
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Box key={j} sx={{ flex: 1, px: 1 }}>
              <Skeleton variant="text" height={20} animation={animation} />
            </Box>
          ))}
          {withActions && (
            <Box sx={{ width: 80, display: 'flex', gap: 1 }}>
              <Skeleton variant="circular" width={24} height={24} animation={animation} />
              <Skeleton variant="circular" width={24} height={24} animation={animation} />
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
  
  // Card skeleton
  const renderCardSkeleton = () => (
    <Card sx={{ height, width, ...sx }}>
      {withHeader && (
        <CardHeader
          avatar={<Skeleton variant="circular" width={40} height={40} animation={animation} />}
          title={<Skeleton variant="text" height={20} width="80%" animation={animation} />}
          subheader={<Skeleton variant="text" height={16} width="40%" animation={animation} />}
          action={withActions ? (
            <Skeleton variant="rectangular" width={48} height={48} animation={animation} />
          ) : undefined}
        />
      )}
      {withImage && (
        <Skeleton 
          variant="rectangular" 
          height={140} 
          width="100%" 
          animation={animation} 
        />
      )}
      <CardContent>
        <Skeleton variant="text" height={20} animation={animation} />
        <Skeleton variant="text" height={20} width="80%" animation={animation} />
        <Skeleton variant="text" height={20} width="60%" animation={animation} />
        {withFooter && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Skeleton variant="rectangular" width={80} height={36} animation={animation} />
            <Skeleton variant="rectangular" width={80} height={36} animation={animation} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
  
  // List skeleton
  const renderListSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      {withHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width={150} height={32} animation={animation} />
          {withActions && (
            <Skeleton variant="rectangular" width={100} height={36} animation={animation} />
          )}
        </Box>
      )}
      
      {Array.from({ length: count }).map((_, i) => (
        <Box 
          key={i} 
          sx={{ 
            display: 'flex', 
            py: dense ? 1 : 2, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            alignItems: 'center'
          }}
        >
          {withImage && (
            <Skeleton 
              variant="rectangular" 
              width={48} 
              height={48} 
              animation={animation} 
              sx={{ mr: 2, borderRadius: 1 }} 
            />
          )}
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" height={20} width="60%" animation={animation} />
            <Skeleton variant="text" height={16} width="40%" animation={animation} />
          </Box>
          {withActions && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="circular" width={32} height={32} animation={animation} />
              <Skeleton variant="circular" width={32} height={32} animation={animation} />
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
  
  // Grid skeleton
  const renderGridSkeleton = () => (
    <Grid container spacing={spacing}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={12} sm={6} md={12 / columns} key={i}>
          <Card sx={{ height: '100%' }}>
            {withImage && (
              <Skeleton 
                variant="rectangular" 
                height={140} 
                width="100%" 
                animation={animation} 
              />
            )}
            <CardContent>
              <Skeleton variant="text" height={24} animation={animation} />
              <Skeleton variant="text" height={16} width="80%" animation={animation} />
              <Skeleton variant="text" height={16} width="60%" animation={animation} />
              {withActions && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Skeleton variant="rectangular" width={60} height={32} animation={animation} />
                  <Skeleton variant="rectangular" width={60} height={32} animation={animation} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
  
  // Detail view skeleton
  const renderDetailSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', mb: 3 }}>
        {withImage && (
          <Skeleton 
            variant="rectangular" 
            width={200} 
            height={200} 
            animation={animation} 
            sx={{ mr: 3, borderRadius: 1 }} 
          />
        )}
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" height={40} width="70%" animation={animation} />
          <Skeleton variant="text" height={20} width="40%" animation={animation} sx={{ mb: 2 }} />
          <Skeleton variant="text" height={16} animation={animation} />
          <Skeleton variant="text" height={16} animation={animation} />
          <Skeleton variant="text" height={16} width="80%" animation={animation} />
          
          {withActions && (
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Skeleton variant="rectangular" width={120} height={40} animation={animation} />
              <Skeleton variant="rectangular" width={120} height={40} animation={animation} />
            </Box>
          )}
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" height={32} width="40%" animation={animation} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={16} animation={animation} />
            <Skeleton variant="text" height={16} animation={animation} />
            <Skeleton variant="text" height={16} width="90%" animation={animation} />
            <Skeleton variant="text" height={16} width="80%" animation={animation} />
          </Box>
          
          <Box>
            <Skeleton variant="text" height={32} width="40%" animation={animation} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={200} animation={animation} />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
            <Skeleton variant="text" height={24} width="60%" animation={animation} sx={{ mb: 2 }} />
            
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Skeleton variant="text" height={16} width="40%" animation={animation} />
                <Skeleton variant="text" height={16} width="40%" animation={animation} />
              </Box>
            ))}
            
            <Skeleton variant="rectangular" height={40} animation={animation} sx={{ mt: 2 }} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
  
  // Form skeleton
  const renderFormSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      {withHeader && (
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" height={32} width="40%" animation={animation} />
          <Skeleton variant="text" height={16} width="60%" animation={animation} />
        </Box>
      )}
      
      <Grid container spacing={3}>
        {Array.from({ length: rows * columns }).map((_, i) => (
          <Grid item xs={12} sm={12 / columns} key={i}>
            <Skeleton variant="text" height={16} width="40%" animation={animation} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={56} animation={animation} />
          </Grid>
        ))}
      </Grid>
      
      {withFooter && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Skeleton variant="rectangular" width={100} height={40} animation={animation} />
          <Skeleton variant="rectangular" width={100} height={40} animation={animation} />
        </Box>
      )}
    </Box>
  );
  
  // Chart skeleton
  const renderChartSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      {withHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Skeleton variant="text" height={24} width={150} animation={animation} />
            <Skeleton variant="text" height={16} width={100} animation={animation} />
          </Box>
          {withActions && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
              <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
            </Box>
          )}
        </Box>
      )}
      
      <Skeleton 
        variant="rectangular" 
        height={height || 300} 
        animation={animation} 
        sx={{ borderRadius: 1 }} 
      />
      
      {withFooter && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width={60} height={24} animation={animation} />
          ))}
        </Box>
      )}
    </Box>
  );
  
  // Dashboard skeleton
  const renderDashboardSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      {/* Stats row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Skeleton variant="text" width={80} height={16} animation={animation} />
                  <Skeleton variant="text" width={60} height={30} animation={animation} sx={{ mt: 1 }} />
                </Box>
                <Skeleton variant="circular" width={40} height={40} animation={animation} />
              </Box>
              <Skeleton variant="rectangular" height={4} animation={animation} sx={{ mt: 2 }} />
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Charts row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Skeleton variant="text" height={24} width={150} animation={animation} />
            <Skeleton variant="rectangular" height={250} animation={animation} sx={{ mt: 2 }} />
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Skeleton variant="text" height={24} width={150} animation={animation} />
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
              <Skeleton variant="circular" width={200} height={200} animation={animation} />
            </Box>
          </Card>
        </Grid>
      </Grid>
      
      {/* Table */}
      <Card sx={{ p: 2 }}>
        <Skeleton variant="text" height={24} width={150} animation={animation} sx={{ mb: 2 }} />
        <Box>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ width: 40 }}>
                <Skeleton variant="circular" width={32} height={32} animation={animation} />
              </Box>
              <Box sx={{ flex: 2, px: 1 }}>
                <Skeleton variant="text" height={16} animation={animation} />
              </Box>
              <Box sx={{ flex: 1, px: 1 }}>
                <Skeleton variant="text" height={16} animation={animation} />
              </Box>
              <Box sx={{ flex: 1, px: 1 }}>
                <Skeleton variant="text" height={16} animation={animation} />
              </Box>
              <Box sx={{ flex: 1, px: 1 }}>
                <Skeleton variant="text" height={16} animation={animation} />
              </Box>
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  );
  
  // Profile skeleton
  const renderProfileSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 3, md: 0 }, mr: { md: 4 } }}>
          <Skeleton variant="circular" width={150} height={150} animation={animation} />
          <Skeleton variant="text" height={24} width={120} animation={animation} sx={{ mt: 2 }} />
          <Skeleton variant="text" height={16} width={80} animation={animation} />
          
          {withActions && (
            <Skeleton variant="rectangular" width={120} height={36} animation={animation} sx={{ mt: 2 }} />
          )}
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="text" height={16} width="40%" animation={animation} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={56} animation={animation} sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="text" height={16} width="40%" animation={animation} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={56} animation={animation} sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Skeleton variant="text" height={16} width="40%" animation={animation} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={56} animation={animation} sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Skeleton variant="text" height={16} width="40%" animation={animation} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={100} animation={animation} />
            </Grid>
          </Grid>
        </Box>
      </Box>
      
      <Box>
        <Skeleton variant="text" height={32} width="30%" animation={animation} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={200} animation={animation} />
                <CardContent>
                  <Skeleton variant="text" height={24} animation={animation} />
                  <Skeleton variant="text" height={16} width="80%" animation={animation} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
  
  // Feed skeleton
  const renderFeedSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} sx={{ mb: 2 }}>
          <CardHeader
            avatar={<Skeleton variant="circular" width={40} height={40} animation={animation} />}
            title={<Skeleton variant="text" height={20} width="60%" animation={animation} />}
            subheader={<Skeleton variant="text" height={16} width="40%" animation={animation} />}
            action={withActions ? (
              <Skeleton variant="circular" width={32} height={32} animation={animation} />
            ) : undefined}
          />
          
          {withImage && Math.random() > 0.3 && (
            <Skeleton variant="rectangular" height={250} animation={animation} />
          )}
          
          <CardContent>
            <Skeleton variant="text" height={16} animation={animation} />
            <Skeleton variant="text" height={16} animation={animation} />
            <Skeleton variant="text" height={16} width="80%" animation={animation} />
          </CardContent>
          
          {withFooter && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant="circular" width={24} height={24} animation={animation} />
                <Skeleton variant="text" height={24} width={30} animation={animation} />
                <Skeleton variant="circular" width={24} height={24} animation={animation} />
                <Skeleton variant="text" height={24} width={30} animation={animation} />
              </Box>
              <Skeleton variant="circular" width={24} height={24} animation={animation} />
            </Box>
          )}
        </Card>
      ))}
    </Box>
  );
  
  // Render the appropriate skeleton based on variant
  const renderSkeleton = () => {
    switch (variant) {
      case 'table':
        return renderTableSkeleton();
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'grid':
        return renderGridSkeleton();
      case 'detail':
        return renderDetailSkeleton();
      case 'form':
        return renderFormSkeleton();
      case 'chart':
        return renderChartSkeleton();
      case 'dashboard':
        return renderDashboardSkeleton();
      case 'profile':
        return renderProfileSkeleton();
      case 'feed':
        return renderFeedSkeleton();
      default:
        return renderCardSkeleton();
    }
  };
  
  return (
    <Container {...containerProps}>
      {renderSkeleton()}
    </Container>
  );
};

export default SkeletonScreen; 