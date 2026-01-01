import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VoiceNoteRecorder from './VoiceNoteRecorder';
import VoiceNotePlayer from './VoiceNotePlayer';
import {
  createMedia,
  getVoiceNotesByEntity,
  deleteMedia,
  LocalMedia,
} from '../services/database';

interface VoiceNotesSectionProps {
  entityType: 'site' | 'borehole' | 'pump_test' | 'water_quality' | 'water_level';
  entityId: string;
  createdBy?: string;
}

export default function VoiceNotesSection({
  entityType,
  entityId,
  createdBy,
}: VoiceNotesSectionProps) {
  const [voiceNotes, setVoiceNotes] = useState<LocalMedia[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [captionInput, setCaptionInput] = useState('');
  const [pendingRecording, setPendingRecording] = useState<{
    uri: string;
    duration: number;
    fileSize: number;
    fileName: string;
  } | null>(null);

  const loadVoiceNotes = useCallback(async () => {
    try {
      const notes = await getVoiceNotesByEntity(entityType, entityId);
      setVoiceNotes(notes);
    } catch (error) {
      console.error('Failed to load voice notes:', error);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadVoiceNotes();
  }, [loadVoiceNotes]);

  const handleRecordingComplete = (recording: {
    uri: string;
    duration: number;
    fileSize: number;
    fileName: string;
  }) => {
    setPendingRecording(recording);
    setShowRecorder(false);
  };

  const saveVoiceNote = async () => {
    if (!pendingRecording) return;

    try {
      await createMedia({
        linkedEntityType: entityType,
        linkedEntityId: entityId,
        fileName: pendingRecording.fileName,
        fileType: 'audio/m4a',
        fileSize: pendingRecording.fileSize,
        localPath: pendingRecording.uri,
        caption: captionInput.trim() || undefined,
        capturedAt: new Date().toISOString(),
        duration: pendingRecording.duration,
        createdBy,
      });

      await loadVoiceNotes();
      setPendingRecording(null);
      setCaptionInput('');
    } catch (error) {
      console.error('Failed to save voice note:', error);
      Alert.alert('Error', 'Failed to save voice note');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Voice Note',
      'Are you sure you want to delete this voice note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedia(id);
              await loadVoiceNotes();
            } catch (error) {
              console.error('Failed to delete voice note:', error);
              Alert.alert('Error', 'Failed to delete voice note');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="mic" size={20} color="#374151" />
        <Text style={styles.title}>Voice Notes ({voiceNotes.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowRecorder(true)}
        >
          <Ionicons name="add" size={20} color="#0891b2" />
        </TouchableOpacity>
      </View>

      {voiceNotes.length === 0 ? (
        <Text style={styles.emptyText}>No voice notes recorded</Text>
      ) : (
        voiceNotes.map((note) => (
          <VoiceNotePlayer
            key={note.id}
            uri={note.localPath}
            duration={note.duration || 0}
            caption={note.caption}
            createdAt={note.createdAt}
            onDelete={() => handleDelete(note.id)}
          />
        ))
      )}

      {/* Recording Modal */}
      <Modal visible={showRecorder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Voice Note</Text>
              <TouchableOpacity onPress={() => setShowRecorder(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <VoiceNoteRecorder
              onRecordingComplete={handleRecordingComplete}
              onCancel={() => setShowRecorder(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Caption Modal */}
      <Modal visible={!!pendingRecording} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.captionModal}>
            <Text style={styles.modalTitle}>Add Caption (Optional)</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Describe this voice note..."
              placeholderTextColor="#9ca3af"
              value={captionInput}
              onChangeText={setCaptionInput}
              multiline
              maxLength={200}
            />
            <View style={styles.captionButtons}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  setCaptionInput('');
                  saveVoiceNote();
                }}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveVoiceNote}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  addButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  captionModal: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 'auto',
    marginBottom: 'auto',
    borderRadius: 16,
    padding: 24,
  },
  captionInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 16,
    marginBottom: 16,
  },
  captionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0891b2',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
