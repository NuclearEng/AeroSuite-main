import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../../services/api';

const ConductInspectionScreen = ({ route, navigation }) => {
  const { inspectionId } = route.params || { inspectionId: null };
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inspection, setInspection] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [defects, setDefects] = useState([]);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  
  const cameraRef = useRef(null);

  // Request permissions and load data
  useEffect(() => {
    const setupScreen = async () => {
      try {
        // Check network status to determine if in offline mode
        const isOffline = !(await checkNetworkStatus());
        setOfflineMode(isOffline);
        
        // Request camera permissions
        const { status: cameraStatus } = await Camera.requestPermissionsAsync();
        setHasPermission(cameraStatus === 'granted');
        
        // Request location permissions
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          setLocation(currentLocation);
        }
        
        // Load inspection data
        await loadInspectionData();
      } catch (error) {
        console.error('Error setting up screen:', error);
        Alert.alert('Error', 'Failed to set up inspection screen');
      } finally {
        setLoading(false);
      }
    };
    
    setupScreen();
  }, []);

  // Check network status
  const checkNetworkStatus = async () => {
    try {
      // In a real app, this would use NetInfo
      return true; // Mock online status for demo
    } catch (error) {
      return false;
    }
  };

  // Load inspection data
  const loadInspectionData = async () => {
    try {
      let inspectionData;
      
      if (offlineMode) {
        // Try to load from local storage if offline
        const savedData = await AsyncStorage.getItem(`inspection_${inspectionId}`);
        if (savedData) {
          inspectionData = JSON.parse(savedData);
        } else {
          throw new Error('Inspection data not available offline');
        }
      } else {
        // Load from API if online
        inspectionData = await ApiService.get(`inspections/${inspectionId}`);
        
        // Save to local storage for offline access
        await AsyncStorage.setItem(
          `inspection_${inspectionId}`,
          JSON.stringify(inspectionData)
        );
      }
      
      // Set state with loaded data
      setInspection(inspectionData);
      setChecklist(inspectionData.checklist || []);
      setNotes(inspectionData.notes || '');
      setPhotos(inspectionData.photos || []);
      setDefects(inspectionData.defects || []);
      
    } catch (error) {
      console.error('Error loading inspection data:', error);
      Alert.alert('Error', 'Failed to load inspection data');
    }
  };

  // Toggle checklist item completion
  const toggleChecklistItem = (index) => {
    const updatedChecklist = [...checklist];
    updatedChecklist[index].completed = !updatedChecklist[index].completed;
    setChecklist(updatedChecklist);
  };

  // Add a defect
  const addDefect = () => {
    const newDefect = {
      id: `defect_${Date.now()}`,
      description: '',
      severity: 'medium',
      photos: [],
    };
    
    setDefects([...defects, newDefect]);
  };

  // Update defect details
  const updateDefect = (index, field, value) => {
    const updatedDefects = [...defects];
    updatedDefects[index][field] = value;
    setDefects(updatedDefects);
  };

  // Take a photo
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotos([...photos, photo]);
        setCameraVisible(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  // Pick an image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.cancelled) {
        setPhotos([...photos, result]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Handle barcode scan
  const handleBarCodeScanned = ({ type, data }) => {
    setScannerVisible(false);
    Alert.alert('Barcode Scanned', `Type: ${type}\nData: ${data}`);
    // In a real app, you would associate this with the inspection
  };

  // Save inspection data
  const saveInspection = async () => {
    setSaving(true);
    
    try {
      const inspectionData = {
        ...inspection,
        checklist,
        notes,
        defects,
        completedAt: new Date().toISOString(),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : null,
      };
      
      if (offlineMode) {
        // Save to local storage if offline
        await AsyncStorage.setItem(
          `inspection_${inspectionId}_completed`,
          JSON.stringify(inspectionData)
        );
        
        Alert.alert(
          'Saved Offline',
          'Inspection saved locally. It will be uploaded when connection is restored.'
        );
      } else {
        // Upload photos first
        const photoUrls = await uploadPhotos();
        
        // Then save inspection with photo URLs
        await ApiService.put(`inspections/${inspectionId}/complete`, {
          ...inspectionData,
          photoUrls,
        });
        
        Alert.alert('Success', 'Inspection completed successfully');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving inspection:', error);
      Alert.alert('Error', 'Failed to save inspection');
    } finally {
      setSaving(false);
    }
  };

  // Upload photos
  const uploadPhotos = async () => {
    if (photos.length === 0) return [];
    
    const photoUrls = [];
    
    for (const photo of photos) {
      try {
        const filename = photo.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        const response = await ApiService.uploadFile('inspections/photos', {
          uri: photo.uri,
          name: filename,
          type,
        }, { inspectionId });
        
        photoUrls.push(response.url);
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }
    
    return photoUrls;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading inspection...</Text>
      </View>
    );
  }

  if (cameraVisible) {
    return (
      <View style={styles.cameraContainer}>
        <Camera ref={cameraRef} style={styles.camera}>
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={() => setCameraVisible(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={takePicture}
            >
              <Ionicons name="camera" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </Camera>
      </View>
    );
  }

  if (scannerVisible) {
    return (
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => setScannerVisible(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {offlineMode && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={20} color="white" />
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.title}>{inspection?.title || 'Inspection'}</Text>
        <Text style={styles.subtitle}>
          {inspection?.supplier?.name || 'Unknown Supplier'}
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Checklist</Text>
        {checklist.map((item, index) => (
          <TouchableOpacity
            key={item.id || index}
            style={styles.checklistItem}
            onPress={() => toggleChecklistItem(index)}
          >
            <Ionicons
              name={item.completed ? 'checkbox' : 'square-outline'}
              size={24}
              color={item.completed ? '#1976d2' : '#666'}
            />
            <Text style={[
              styles.checklistText,
              item.completed && styles.checklistTextCompleted
            ]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Enter inspection notes here..."
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => {
                  const updatedPhotos = [...photos];
                  updatedPhotos.splice(index, 1);
                  setPhotos(updatedPhotos);
                }}
              >
                <Ionicons name="close-circle" size={24} color="red" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={() => setCameraVisible(true)}
          >
            <Ionicons name="camera" size={30} color="#1976d2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={pickImage}
          >
            <Ionicons name="images" size={30} color="#1976d2" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Defects</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={addDefect}
          >
            <Text style={styles.addButtonText}>Add Defect</Text>
          </TouchableOpacity>
        </View>
        
        {defects.map((defect, index) => (
          <View key={defect.id} style={styles.defectItem}>
            <TextInput
              style={styles.defectInput}
              value={defect.description}
              onChangeText={(text) => updateDefect(index, 'description', text)}
              placeholder="Describe the defect..."
            />
            <View style={styles.severityContainer}>
              <Text style={styles.severityLabel}>Severity:</Text>
              {['low', 'medium', 'high'].map((severity) => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.severityButton,
                    defect.severity === severity && styles.severityButtonActive,
                    { backgroundColor: getSeverityColor(severity) }
                  ]}
                  onPress={() => updateDefect(index, 'severity', severity)}
                >
                  <Text style={styles.severityButtonText}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setScannerVisible(true)}
        >
          <Ionicons name="barcode" size={24} color="white" />
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveInspection}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="save" size={24} color="white" />
              <Text style={styles.saveButtonText}>Complete Inspection</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Helper function to get color for severity
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'low':
      return '#4caf50';
    case 'medium':
      return '#ff9800';
    case 'high':
      return '#f44336';
    default:
      return '#ff9800';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  offlineBanner: {
    backgroundColor: '#ff9800',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  header: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  checklistText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
    color: '#333',
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoContainer: {
    width: 100,
    height: 100,
    margin: 5,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defectItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  defectInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
    marginBottom: 10,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  severityLabel: {
    marginRight: 10,
    fontSize: 16,
    color: '#333',
  },
  severityButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  severityButtonActive: {
    borderWidth: 2,
    borderColor: '#333',
  },
  severityButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  scanButton: {
    backgroundColor: '#607d8b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cameraButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConductInspectionScreen; 