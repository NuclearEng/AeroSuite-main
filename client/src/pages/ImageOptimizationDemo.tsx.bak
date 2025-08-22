import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  useTheme,
  alpha,
  SelectChangeEvent } from
'@mui/material';
import {
  ImageSize,
  ImageFormat,
  ImageQuality,
  ImageLoadingStrategy,
  estimateFileSize,
  isBrowserCompatible } from
'../utils/imageOptimization';
import OptimizedImage from '../components/common/OptimizedImage';
import { PageHeader } from '../components/common';

// Sample images for demo
const sampleImages = [
{
  url: 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a',
  alt: 'Airplane parts manufacturing',
  width: 4000,
  height: 6000
},
{
  url: 'https://images.unsplash.com/photo-1598521426169-649f4f4a6bf2',
  alt: 'Jet engine maintenance',
  width: 3200,
  height: 4800
},
{
  url: 'https://images.unsplash.com/photo-1526841535633-ef3be0b21fd2',
  alt: 'Aircraft factory',
  width: 5600,
  height: 3733
},
{
  url: 'https://images.unsplash.com/photo-1579356794301-19c2142a3a43',
  alt: 'Airplane inspection',
  width: 4300,
  height: 2868
}];


const ImageOptimizationDemo: React.FC = () => {
  const theme = useTheme();

  // State for image optimization options
  const [selectedImage, setSelectedImage] = useState(sampleImages[0]);
  const [size, setSize] = useState<ImageSize>(ImageSize.MEDIUM);
  const [format, setFormat] = useState<ImageFormat>(ImageFormat.WEBP);
  const [quality, setQuality] = useState<ImageQuality>(ImageQuality.HIGH);
  const [loading, setLoading] = useState<ImageLoadingStrategy>(ImageLoadingStrategy.LAZY);
  const [blur, setBlur] = useState(true);
  const [comparison, setComparison] = useState(false);

  // Calculate estimated file sizes
  const originalSize = estimateFileSize(
    selectedImage.width,
    selectedImage.height,
    ImageFormat.JPEG,
    100
  );

  const optimizedSize = estimateFileSize(
    size === ImageSize.ORIGINAL ? selectedImage.width :
    size === ImageSize.LARGE ? 1200 :
    size === ImageSize.MEDIUM ? 600 :
    size === ImageSize.SMALL ? 300 : 100,
    size === ImageSize.ORIGINAL ? selectedImage.height :
    size === ImageSize.LARGE ? 1200 :
    size === ImageSize.MEDIUM ? 600 :
    size === ImageSize.SMALL ? 300 : 100,
    format,
    quality === ImageQuality.LOW ? 30 :
    quality === ImageQuality.MEDIUM ? 60 :
    quality === ImageQuality.HIGH ? 80 : 95
  );

  const savingsPercent = Math.round((1 - optimizedSize / originalSize) * 100);

  // Handler functions for form controls
  const handleImageChange = (event: SelectChangeEvent<string>) => {
    const selectedUrl = event.target.value;
    const image = sampleImages.find((img) => img.url === selectedUrl);
    if (image) {
      setSelectedImage(image);
    }
  };

  const handleSizeChange = (event: SelectChangeEvent<string>) => {
    setSize(event.target.value as ImageSize);
  };

  const handleFormatChange = (event: SelectChangeEvent<string>) => {
    setFormat(event.target.value as ImageFormat);
  };

  const handleQualityChange = (event: SelectChangeEvent<string>) => {
    setQuality(event.target.value as ImageQuality);
  };

  const handleLoadingChange = (event: SelectChangeEvent<string>) => {
    setLoading(event.target.value as ImageLoadingStrategy);
  };

  const handleBlurChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBlur(event.target.checked);
  };

  const handleComparisonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComparison(event.target.checked);
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check format compatibility
  const isFormatSupported = isBrowserCompatible(format);

  return (
    <Box>
      <PageHeader
        title="Image Optimization Demo"
        subtitle="Demonstrate automatic image optimization features"
        breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Demo', href: '/demo' },
        { label: 'Image Optimization' }]
        } />

      
      <Grid container spacing={3}>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimization Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="image-select-label">Sample Image</InputLabel>
                <Select
                  labelId="image-select-label"
                  value={selectedImage.url}
                  label="Sample Image"
                  onChange={handleImageChange}>

                  {sampleImages.map((image, index) =>
                  <MenuItem key={index} value={image.url}>
                      {image.alt}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="size-select-label">Size</InputLabel>
                <Select
                  labelId="size-select-label"
                  value={size}
                  label="Size"
                  onChange={handleSizeChange}>

                  <MenuItem value={ImageSize.THUMBNAIL}>Thumbnail (100x100)</MenuItem>
                  <MenuItem value={ImageSize.SMALL}>Small (300x300)</MenuItem>
                  <MenuItem value={ImageSize.MEDIUM}>Medium (600x600)</MenuItem>
                  <MenuItem value={ImageSize.LARGE}>Large (1200x1200)</MenuItem>
                  <MenuItem value={ImageSize.ORIGINAL}>Original</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="format-select-label">Format</InputLabel>
                <Select
                  labelId="format-select-label"
                  value={format}
                  label="Format"
                  onChange={handleFormatChange}>

                  <MenuItem value={ImageFormat.WEBP}>
                    WebP {isBrowserCompatible(ImageFormat.WEBP) ? '✓' : '✗'}
                  </MenuItem>
                  <MenuItem value={ImageFormat.AVIF}>
                    AVIF {isBrowserCompatible(ImageFormat.AVIF) ? '✓' : '✗'}
                  </MenuItem>
                  <MenuItem value={ImageFormat.JPEG}>JPEG</MenuItem>
                  <MenuItem value={ImageFormat.PNG}>PNG</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="quality-select-label">Quality</InputLabel>
                <Select
                  labelId="quality-select-label"
                  value={quality}
                  label="Quality"
                  onChange={handleQualityChange}>

                  <MenuItem value={ImageQuality.LOW}>Low (30%)</MenuItem>
                  <MenuItem value={ImageQuality.MEDIUM}>Medium (60%)</MenuItem>
                  <MenuItem value={ImageQuality.HIGH}>High (80%)</MenuItem>
                  <MenuItem value={ImageQuality.BEST}>Best (95%)</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="loading-select-label">Loading Strategy</InputLabel>
                <Select
                  labelId="loading-select-label"
                  value={loading}
                  label="Loading Strategy"
                  onChange={handleLoadingChange}>

                  <MenuItem value={ImageLoadingStrategy.LAZY}>Lazy Loading</MenuItem>
                  <MenuItem value={ImageLoadingStrategy.EAGER}>Eager Loading</MenuItem>
                  <MenuItem value={ImageLoadingStrategy.PROGRESSIVE}>Progressive (Blur-up)</MenuItem>
                </Select>
              </FormControl>
              
              <Box mt={2}>
                <FormControlLabel
                  control={<Switch checked={blur} onChange={handleBlurChange} />}
                  label="Blur-up effect" />

              </Box>
              
              <Box mt={1}>
                <FormControlLabel
                  control={<Switch checked={comparison} onChange={handleComparisonChange} />}
                  label="Show side-by-side comparison" />

              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Estimated File Size
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.error.main, 0.1)
                    }}>

                    <Typography variant="body2" color="text.secondary">
                      Original
                    </Typography>
                    <Typography variant="h6" color="error">
                      {formatFileSize(originalSize)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.success.main, 0.1)
                    }}>

                    <Typography variant="body2" color="text.secondary">
                      Optimized
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatFileSize(optimizedSize)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {savingsPercent > 0 &&
              <Box mt={2} textAlign="center">
                  <Chip
                  label={`${savingsPercent}% smaller`}
                  color="success"
                  variant="outlined" />

                </Box>
              }
              
              {!isFormatSupported &&
              <Box mt={2} p={1} bgcolor={alpha(theme.palette.warning.main, 0.1)} borderRadius={1}>
                  <Typography variant="body2" color="warning.main">
                    ⚠️ Your browser doesn't support {format}. The image will be served in a fallback format.
                  </Typography>
                </Box>
              }
            </CardContent>
          </Card>
        </Grid>
        
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {comparison ? 'Side-by-Side Comparison' : 'Optimized Image'}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {comparison ?
              <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" align="center" gutterBottom>
                      Original
                    </Typography>
                    <Box
                    component="img"
                    src={selectedImage.url}
                    alt={selectedImage.alt}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 1,
                      mb: 1
                    }} />

                    <Typography variant="body2" color="text.secondary" align="center">
                      {formatFileSize(originalSize)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" align="center" gutterBottom>
                      Optimized
                    </Typography>
                    <OptimizedImage
                    src={selectedImage.url}
                    alt={selectedImage.alt}
                    size={size}
                    format={format}
                    quality={quality}
                    loading={loading}
                    blur={blur}
                    style={{ borderRadius: theme.shape.borderRadius }} />

                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                      {formatFileSize(optimizedSize)}
                    </Typography>
                  </Grid>
                </Grid> :

              <Box>
                  <OptimizedImage
                  src={selectedImage.url}
                  alt={selectedImage.alt}
                  size={size}
                  format={format}
                  quality={quality}
                  loading={loading}
                  blur={blur}
                  style={{ borderRadius: theme.shape.borderRadius }} />

                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    {selectedImage.alt} - {formatFileSize(optimizedSize)}
                  </Typography>
                </Box>
              }
              
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Original Image Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Dimensions: {selectedImage.width}x{selectedImage.height} pixels<br />
                  • Source: Unsplash<br />
                  • URL: {selectedImage.url}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" paragraph>
                The image optimization pipeline automatically:
              </Typography>
              
              <Typography component="ol" variant="body2" sx={{ pl: 2 }}>
                <li>Resizes images to the appropriate dimensions for each device</li>
                <li>Converts images to modern formats like WebP or AVIF when supported</li>
                <li>Compresses images with the optimal quality setting</li>
                <li>Generates low-resolution placeholders for blur-up loading</li>
                <li>Uses browser lazy loading to improve page performance</li>
                <li>Caches optimized images for faster subsequent loads</li>
              </Typography>
              
              <Box mt={2} p={2} bgcolor={alpha(theme.palette.info.main, 0.05)} borderRadius={1}>
                <Typography variant="subtitle2" color="info.main">
                  Benefits
                </Typography>
                <Typography variant="body2">
                  • Reduced page load time<br />
                  • Lower bandwidth usage<br />
                  • Better user experience<br />
                  • Improved SEO (Core Web Vitals)<br />
                  • Reduced storage and CDN costs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>);

};

export default ImageOptimizationDemo;