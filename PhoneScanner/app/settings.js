import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const SERVER_IP_KEY = 'scanner_server_ip';

export default function SettingsScreen() {
  const router = useRouter();
  const [serverIp, setServerIp] = useState('');
  const [networkInfo, setNetworkInfo] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  
  useEffect(() => {
    loadServerIp();
    getNetworkInfo();
  }, []);
  
  const loadServerIp = async () => {
    try {
      const storedIp = await AsyncStorage.getItem(SERVER_IP_KEY);
      if (storedIp) {
        setServerIp(storedIp);
      }
    } catch (error) {
      console.error('Error loading server IP:', error);
    }
  };
  
  const saveServerIp = async () => {
    try {
      if (!serverIp.trim()) {
        Alert.alert('Error', 'Please enter a valid server IP address');
        return;
      }
      
      await AsyncStorage.setItem(SERVER_IP_KEY, serverIp);
      Alert.alert(
        'Success',
        'Server IP saved successfully',
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error saving server IP:', error);
      Alert.alert('Error', 'Failed to save server IP');
    }
  };
  
  const getNetworkInfo = async () => {
    const info = await NetInfo.fetch();
    setNetworkInfo(info);
  };
  
  const testConnection = async () => {
    if (!serverIp.trim()) {
      Alert.alert('Error', 'Please enter a server IP address');
      return;
    }
    
    setIsTesting(true);
    
    try {
      const response = await fetch(`http://${serverIp}/discover`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
      
      if (response.ok) {
        Alert.alert(
          'Success',
          'Connected to server successfully!',
          [
            { text: 'OK' }
          ]
        );
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      Alert.alert(
        'Error',
        'Could not connect to server. Please check the IP address and make sure the server is running.',
        [
          { text: 'OK' }
        ]
      );
    }
    
    setIsTesting(false);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "Settings",
          headerStyle: { backgroundColor: '#4A90E2' },
          headerTintColor: '#fff',
          headerBackTitle: "Back",
        }}
      />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server Configuration</Text>
          <Text style={styles.description}>
            Enter your computer's IP address and port (e.g., 192.168.1.100:5000)
          </Text>
          
          <TextInput
            style={styles.input}
            value={serverIp}
            onChangeText={setServerIp}
            placeholder="Enter server IP address (e.g. 192.168.1.100:5000)"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.halfButton]}
              onPress={saveServerIp}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.halfButton]}
              onPress={testConnection}
              disabled={isTesting}
            >
              <Text style={styles.buttonText}>
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Information</Text>
          <Text style={styles.infoText}>
            Type: {networkInfo?.type || 'Unknown'}
          </Text>
          <Text style={styles.infoText}>
            IP Address: {networkInfo?.details?.ipAddress || 'Unknown'}
          </Text>
          <Text style={styles.infoText}>
            Connected: {networkInfo?.isConnected ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help</Text>
          <Text style={styles.description}>
            Make sure your phone and computer are connected to the same WiFi network.
            The server should be running on your computer to receive scanned documents.
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={() => Alert.alert('Help', 'To use this app, make sure you:\n\n1. Have the server running on your computer\n2. Connect both devices to the same network\n3. Enter the correct IP address and port')}
          >
            <Text style={styles.outlineButtonText}>View Help</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 5,
  },
  halfButton: {
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  outlineButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
});