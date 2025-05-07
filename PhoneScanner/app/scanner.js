import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';

export default function ScannerScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState('back');
  const [scannedImages, setScannedImages] = useState([]);
  const cameraRef = useRef(null);
  
  // Use the hook properly
  const [permission, requestPermission] = useCameraPermissions();
  
  if (!permission) { 
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.placeholderText}>Loading permissions...</Text>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButtonAbsolute, { bottom: 20, marginBottom: 0}]}>
                <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
  }
  
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.placeholderText}>We need your permission to show the camera</Text>
        <TouchableOpacity 
          onPress={requestPermission}
          style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonAbsolute}>
            <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        const newImages = [...scannedImages, photo.uri];
        setScannedImages(newImages);
        
        // Navigate to preview after taking a picture
        if (newImages.length >= 1) {
          router.push({
            pathname: '/preview',
            params: { images: JSON.stringify(newImages) }
          });
        }
      } catch (error) {
        console.error("Failed to take picture:", error);
      }
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
        <CameraView 
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
        />
        <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.controlButton}> 
                <Text style={styles.buttonText}>Flip Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                <View style={styles.captureButtonInner}></View>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.back()} style={styles.controlButton}>
                <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
  },
  controlsContainer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 20,
  },
  controlButton: { 
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(50,50,50,0.7)',
    borderRadius: 8,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonAbsolute: { 
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(50,50,50,0.7)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
}); 