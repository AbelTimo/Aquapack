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
import { createBorehole } from '../services/database';
import { useAuthStore } from '../store/authStore';

const WELL_TYPES = [
  { value: 'BOREHOLE', label: 'Borehole' },
  { value: 'DUG_WELL', label: 'Dug Well' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'PIEZOMETER', label: 'Piezometer' },
];

export default function BoreholeFormScreen({ navigation, route }: any) {
  const { siteId } = route.params;
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [wellType, setWellType] = useState('BOREHOLE');
  const [totalDepth, setTotalDepth] = useState('');
  const [depthUnit, setDepthUnit] = useState('meters');
  const [diameter, setDiameter] = useState('');
  const [drillingMethod, setDrillingMethod] = useState('');
  const [driller, setDriller] = useState('');
  const [staticWaterLevel, setStaticWaterLevel] = useState('');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Borehole name is required');
      return false;
    }
    const depth = parseFloat(totalDepth);
    if (isNaN(depth) || depth <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid total depth');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await createBorehole({
        siteId,
        name: name.trim(),
        wellType,
        totalDepth: parseFloat(totalDepth),
        depthUnit,
        diameter: diameter ? parseFloat(diameter) : undefined,
        drillingMethod: drillingMethod.trim() || undefined,
        driller: driller.trim() || undefined,
        staticWaterLevel: staticWaterLevel ? parseFloat(staticWaterLevel) : undefined,
        notes: notes.trim() || undefined,
        createdBy: user?.id,
      });

      Alert.alert('Success', 'Borehole saved', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to save:', error);
      Alert.alert('Error', 'Failed to save borehole');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Borehole Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., BH-001"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Well Type *</Text>
          <View style={styles.optionsRow}>
            {WELL_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.optionButton,
                  wellType === type.value && styles.optionButtonActive,
                ]}
                onPress={() => setWellType(type.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    wellType === type.value && styles.optionButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Depth *</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="0.0"
              placeholderTextColor="#9ca3af"
              value={totalDepth}
              onChangeText={setTotalDepth}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={[styles.unitButton, depthUnit === 'meters' && styles.unitButtonActive]}
              onPress={() => setDepthUnit('meters')}
            >
              <Text style={[styles.unitText, depthUnit === 'meters' && styles.unitTextActive]}>m</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, depthUnit === 'feet' && styles.unitButtonActive]}
              onPress={() => setDepthUnit('feet')}
            >
              <Text style={[styles.unitText, depthUnit === 'feet' && styles.unitTextActive]}>ft</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Diameter (mm)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 150"
            placeholderTextColor="#9ca3af"
            value={diameter}
            onChangeText={setDiameter}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Static Water Level ({depthUnit})</Text>
          <TextInput
            style={styles.input}
            placeholder="Depth to water at rest"
            placeholderTextColor="#9ca3af"
            value={staticWaterLevel}
            onChangeText={setStaticWaterLevel}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Drilling Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Drilling Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Drilling Method</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Rotary Air"
            placeholderTextColor="#9ca3af"
            value={drillingMethod}
            onChangeText={setDrillingMethod}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Driller</Text>
          <TextInput
            style={styles.input}
            placeholder="Drilling company name"
            placeholderTextColor="#9ca3af"
            value={driller}
            onChangeText={setDriller}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional observations..."
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
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.saveButtonText}>Save Borehole</Text>
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unitButtonActive: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  unitTextActive: {
    color: '#fff',
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
