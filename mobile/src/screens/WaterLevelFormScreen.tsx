import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { createWaterLevel } from '../services/database';
import { useAuthStore } from '../store/authStore';

const MEASUREMENT_METHODS = [
  { value: 'MANUAL_TAPE', label: 'Manual Tape' },
  { value: 'PRESSURE_TRANSDUCER', label: 'Pressure Transducer' },
  { value: 'SOUNDER', label: 'Electric Sounder' },
  { value: 'OTHER', label: 'Other' },
];

const MEASUREMENT_TYPES = [
  { value: 'static', label: 'Static' },
  { value: 'dynamic', label: 'Dynamic (Pumping)' },
  { value: 'recovery', label: 'Recovery' },
];

export default function WaterLevelFormScreen({ navigation, route }: any) {
  const { siteId, boreholes = [] } = route.params;
  const { user } = useAuthStore();

  const [depthToWater, setDepthToWater] = useState('');
  const [depthUnit, setDepthUnit] = useState('meters');
  const [measurementMethod, setMeasurementMethod] = useState('MANUAL_TAPE');
  const [measurementType, setMeasurementType] = useState('static');
  const [selectedBorehole, setSelectedBorehole] = useState('');
  const [referencePoint, setReferencePoint] = useState('Top of Casing (TOC)');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    const depth = parseFloat(depthToWater);
    if (isNaN(depth)) {
      Alert.alert('Validation Error', 'Please enter a valid depth value');
      return false;
    }

    // Warning for unusual values
    if (depth < 0 && depth < -10) {
      Alert.alert(
        'Warning',
        'Depth is significantly negative (artesian). Is this correct?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Continue', onPress: () => handleSave(true) },
        ]
      );
      return false;
    }

    if (depth > 200) {
      Alert.alert(
        'Warning',
        'Depth exceeds 200m. Is this correct?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Continue', onPress: () => handleSave(true) },
        ]
      );
      return false;
    }

    return true;
  };

  const handleSave = async (skipValidation = false) => {
    if (!skipValidation && !validateForm()) return;

    setIsSaving(true);
    try {
      await createWaterLevel({
        siteId,
        boreholeId: selectedBorehole || undefined,
        measurementDatetime: new Date().toISOString(),
        depthToWater: parseFloat(depthToWater),
        depthUnit,
        measurementMethod,
        measurementType,
        referencePoint: referencePoint || undefined,
        notes: notes.trim() || undefined,
        createdBy: user?.id,
      });

      Alert.alert('Success', 'Water level recorded', [
        { text: 'Add Another', onPress: () => {
          setDepthToWater('');
          setNotes('');
        }},
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to save:', error);
      Alert.alert('Error', 'Failed to save measurement');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Quick Entry Section */}
      <View style={styles.quickEntry}>
        <Text style={styles.quickEntryLabel}>Depth to Water</Text>
        <View style={styles.quickEntryRow}>
          <TextInput
            style={styles.quickEntryInput}
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            value={depthToWater}
            onChangeText={setDepthToWater}
            keyboardType="decimal-pad"
            autoFocus
          />
          <TouchableOpacity
            style={[styles.unitButton, depthUnit === 'meters' && styles.unitButtonActive]}
            onPress={() => setDepthUnit('meters')}
          >
            <Text style={[styles.unitButtonText, depthUnit === 'meters' && styles.unitButtonTextActive]}>m</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, depthUnit === 'feet' && styles.unitButtonActive]}
            onPress={() => setDepthUnit('feet')}
          >
            <Text style={[styles.unitButtonText, depthUnit === 'feet' && styles.unitButtonTextActive]}>ft</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Options */}
      <View style={styles.section}>
        {/* Borehole Selection */}
        {boreholes.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Borehole (Optional)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedBorehole}
                onValueChange={setSelectedBorehole}
                style={styles.picker}
              >
                <Picker.Item label="Select Borehole..." value="" />
                {boreholes.map((bh: any) => (
                  <Picker.Item key={bh.id} label={bh.name} value={bh.id} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Method */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Measurement Method</Text>
          <View style={styles.optionsRow}>
            {MEASUREMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.optionButton,
                  measurementMethod === method.value && styles.optionButtonActive,
                ]}
                onPress={() => setMeasurementMethod(method.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    measurementMethod === method.value && styles.optionButtonTextActive,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Measurement Type</Text>
          <View style={styles.optionsRow}>
            {MEASUREMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.optionButton,
                  measurementType === type.value && styles.optionButtonActive,
                ]}
                onPress={() => setMeasurementType(type.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    measurementType === type.value && styles.optionButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reference Point */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reference Point</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Top of Casing (TOC)"
            placeholderTextColor="#9ca3af"
            value={referencePoint}
            onChangeText={setReferencePoint}
          />
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any observations..."
            placeholderTextColor="#9ca3af"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={() => handleSave()}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.saveButtonText}>Save Measurement</Text>
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
  quickEntry: {
    backgroundColor: '#0891b2',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  quickEntryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 12,
  },
  quickEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickEntryInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 12,
  },
  unitButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  unitButtonActive: {
    backgroundColor: '#fff',
  },
  unitButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: '#0891b2',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  picker: {
    height: 50,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionButtonActive: {
    backgroundColor: '#ecfeff',
    borderColor: '#0891b2',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionButtonTextActive: {
    color: '#0891b2',
    fontWeight: '500',
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
