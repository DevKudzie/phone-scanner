import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import NetInfo from '@react-native-community/netinfo';

export default function PreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [scannedImages, setScannedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [serverIp, setServerIp] = useState('');
  
  useEffect(() => {
    if (params.images) {
      setScannedImages(JSON.parse(params.images));
    }
    discoverServer();
  }, [params]);
  
  const discoverServer = async () => {
    try {
      // Try to find the server in the local network
      const networkInfo = await NetInfo.fetch();
      if (networkInfo.type === 'wifi') {
        // Extract the base IP address
        const ipAddressSegments = networkInfo.details.ipAddress.split('.');
        const baseIp = `${ipAddressSegments[0]}.${ipAddressSegments[1]}.${ipAddressSegments[2]}`;
        
        // Attempt to discover server at a few common addresses
        const serverEndpoints = [
          `${baseIp}.1:5000`,
          `${baseIp}.100:5000`,
          `${baseIp}.101:5000`,
          `${baseIp}.254:5000`,
          `${baseIp}.2:5000`,
          // Add more possible addresses if needed
        ];
        
        for (const endpoint of serverEndpoints) {
          try {
            const response = await fetch(`http://${endpoint}/discover`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              timeout: 500, // Short timeout for quick discovery
            });
            
            if (response.ok) {
              setServerIp(endpoint);
              console.log('Server discovered at:', endpoint);
              return;
            }
          } catch (error) {
            // Continue trying other IP addresses
          }
        }
        
        // If we reached here, we couldn't find the server
        console.log('Server not found automatically');
      }
    } catch (error) {
      console.error('Error during server discovery:', error);
    }
  };
  
  const sendToPDF = async () => {
    if (!serverIp) {
      Alert.alert(
        'Server Not Found',
        'Enter your computer\'s IP address and port (e.g., 192.168.1.100:5000) in Settings or make sure the server is running.',
        [
          { text: 'OK' }
        ]
      );
      return;
    }
    
    setIsSending(true);
    
    try {
      // In a real app, we would combine multiple images into a PDF here
      // For this demo, we'll just send the first image
      const imageUri = scannedImages[0];
      
      // Create a temp file name for the PDF
      const fileName = `scan_${new Date().getTime()}.pdf`;
      
      // Create a FormData instance
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: fileName,
        type: 'application/pdf',
      });
      
      // Send to server
      const response = await fetch(`http://${serverIp}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.ok) {
        Alert.alert(
          'Success',
          'Document sent successfully!',
          [
            { text: 'OK', onPress: () => router.push('/') }
          ]
        );
      } else {
        throw new Error('Failed to send document');
      }
    } catch (error) {
      console.error('Error sending document:', error);
      Alert.alert(
        'Error',
        'Failed to send document. Please check your connection and try again.',
        [
          { text: 'OK' }
        ]
      );
    }
    
    setIsSending(false);
  };
  
  const shareDocument = async () => {
    try {
      // In real app, would share the PDF
      // For now, share the first image
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(scannedImages[0]);
      } else {
        Alert.alert(
          'Sharing not available',
          'Sharing is not available on this device',
        );
      }
    } catch (error) {
      console.error('Error sharing document:', error);
    }
  };
  
  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };
  
  const handleNextImage = () => {
    if (currentImageIndex < scannedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };
  
  if (scannedImages.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No images available</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "Document Preview",
          headerStyle: { backgroundColor: '#4A90E2' },
          headerTintColor: '#fff',
        }}
      />
      
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: scannedImages[currentImageIndex] }}
          style={styles.previewImage}
          resizeMode="contain"
        />
        
        {scannedImages.length > 1 && (
          <View style={styles.pageNavigation}>
            <TouchableOpacity
              style={[styles.pageNavButton, currentImageIndex === 0 && styles.pageNavButtonDisabled]}
              onPress={handlePrevImage}
              disabled={currentImageIndex === 0}
            >
              <Text style={styles.pageNavButtonText}>◀</Text>
            </TouchableOpacity>
            
            <Text style={styles.pageIndicator}>
              {currentImageIndex + 1} of {scannedImages.length}
            </Text>
            
            <TouchableOpacity
              style={[styles.pageNavButton, currentImageIndex === scannedImages.length - 1 && styles.pageNavButtonDisabled]}
              onPress={handleNextImage}
              disabled={currentImageIndex === scannedImages.length - 1}
            >
              <Text style={styles.pageNavButtonText}>▶</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Send To Computer</Text>
        <Text style={styles.serverStatus}>
          Server: {serverIp ? `Connected (${serverIp})` : 'Not detected'}
        </Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={sendToPDF}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Send as PDF</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={shareDocument}
        >
          <Text style={styles.secondaryButtonText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.outlineButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.outlineButtonText}>Retake</Text>
        </TouchableOpacity>
      </View>
      
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F8F8F8',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  pageNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  pageNavButton: {
    padding: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    marginHorizontal: 10,
  },
  pageNavButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pageNavButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pageIndicator: {
    fontSize: 16,
    color: '#333',
  },
  actionsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  serverStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});