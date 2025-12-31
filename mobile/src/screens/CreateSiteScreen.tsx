import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { createSite } from '../services/database';
import { useAuthStore } from '../store/authStore';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
}

export default function CreateSiteScreen({ navigation, route }: any) {
  const { projectId, projectName } = route.params;
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [siteType, setSiteType] = useState('');
  const [accessNotes, setAccessNotes] = useState('');

  const [location, setLocation] = useState<LocationData | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualCoords, setManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission',
        'Location permission is needed to capture GPS coordinates. You can enter coordinates manually.',
        [{ text: 'OK' }]
      );
      setManualCoords(true);
    } else {
      getLocation();
    }
  };

  const getLocation = async () => {
    setIsGettingLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        altitude: loc.coords.altitude,
      });
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Location Error', 'Could not get GPS location. Please try again or enter manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Site name is required');
      return false;
    }
    if (!code.trim()) {
      Alert.alert('Validation Error', 'Site code is required');
      return false;
    }

    if (manualCoords) {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        Alert.alert('Validation Error', 'Invalid latitude (-90 to 90)');
        return false;
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        Alert.alert('Validation Error', 'Invalid longitude (-180 to 180)');
        return false;
      }
    } else if (!location) {
      Alert.alert('Validation Error', 'GPS location is required. Please capture GPS or enter manually.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const finalLocation = manualCoords
        ? {
            latitude: parseFloat(manualLat),
            longitude: parseFloat(manualLng),
            accuracy: null,
            altitude: null,
          }
        : location!;

      await createSite({
        projectId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        latitude: finalLocation.latitude,
        longitude: finalLocation.longitude,
        accuracy: finalLocation.accuracy ?? undefined,
        altitude: finalLocation.altitude ?? undefined,
        description: description.trim() || undefined,
        siteType: siteType.trim() || undefined,
        accessNotes: accessNotes.trim() || undefined,
        createdBy: user?.id,
      });

      Alert.alert('Success', 'Site created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to create site:', error);
      Alert.alert('Error', 'Failed to save site. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Project Info */}
      <View style={styles.projectBanner}>
        <Ionicons name="folder" size={20} color="#0891b2" />
        <Text style={styles.projectName}>{projectName}</Text>
      </View>

      {/* GPS Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>

        {!manualCoords ? (
          <View style={styles.gpsContainer}>
            {location ? (
              <View style={styles.gpsInfo}>
                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>Latitude:</Text>
                  <Text style={styles.coordValue}>{location.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>Longitude:</Text>
                  <Text style={styles.coordValue}>{location.longitude.toFixed(6)}</Text>
                </View>
                {location.accuracy && (
                  <View style={styles.coordRow}>
                    <Text style={styles.coordLabel}>Accuracy:</Text>
                    <Text style={styles.coordValue}>±{location.accuracy.toFixed(1)} m</Text>
                  </View>
                )}
                {location.altitude && (
                  <View style={styles.coordRow}>
                    <Text style={styles.coordLabel}>Altitude:</Text>
                    <Text style={styles.coordValue}>{location.altitude.toFixed(1)} m</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noLocationText}>No GPS location captured</Text>
            )}

            <View style={styles.gpsButtons}>
              <TouchableOpacity
                style={[styles.gpsButton, isGettingLocation && styles.gpsButtonDisabled]}
                onPress={getLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="locate" size={20} color="#fff" />
                    <Text style={styles.gpsButtonText}>
                      {location ? 'Refresh GPS' : 'Get GPS'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manualButton}
                onPress={() => setManualCoords(true)}
              >
                <Ionicons name="create-outline" size={20} color="#0891b2" />
                <Text style={styles.manualButtonText}>Enter Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.manualContainer}>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Latitude *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="-1.286389"
                  placeholderTextColor="#9ca3af"
                  value={manualLat}
                  onChangeText={setManualLat}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Longitude *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="36.817223"
                  placeholderTextColor="#9ca3af"
                  value={manualLng}
                  onChangeText={setManualLng}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.useGpsButton}
              onPress={() => {
                setManualCoords(false);
                getLocation();
              }}
            >
              <Ionicons name="locate" size={18} color="#0891b2" />
              <Text style={styles.useGpsButtonText}>Use GPS Instead</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Site Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Site Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Site Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Borehole 1"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Site Code *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., BH-001"
            placeholderTextColor="#9ca3af"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Site Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Borehole, Spring, Well"
            placeholderTextColor="#9ca3af"
            value={siteType}
            onChangeText={setSiteType}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Brief description of the site..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Access Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Directions, access restrictions, etc."
            placeholderTextColor="#9ca3af"
            value={accessNotes}
            onChangeText={setAccessNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.saveButtonText}>Save Site</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  projectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  projectName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#0891b2',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  gpsContainer: {
    alignItems: 'center',
  },
  gpsInfo: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  coordLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  noLocationText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  gpsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  gpsButtonDisabled: {
    opacity: 0.7,
  },
  gpsButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  manualButtonText: {
    color: '#0891b2',
    fontWeight: '600',
  },
  manualContainer: {},
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  useGpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    gap: 6,
  },
  useGpsButtonText: {
    color: '#0891b2',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
