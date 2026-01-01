import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { AUDIO_LIMITS } from '@aquapack/shared';

interface VoiceNoteRecorderProps {
  onRecordingComplete: (recording: {
    uri: string;
    duration: number;
    fileSize: number;
    fileName: string;
  }) => void;
  onCancel?: () => void;
  maxDuration?: number;
}

type RecordingState = 'idle' | 'recording' | 'stopped';

export default function VoiceNoteRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = AUDIO_LIMITS.maxDurationSeconds,
}: VoiceNoteRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  useEffect(() => {
    if (recordingState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordingState, pulseAnim]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Microphone access is needed to record voice notes'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setRecordingState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d >= maxDuration - 1) {
            stopRecording();
            return maxDuration;
          }
          return d + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const info = await FileSystem.getInfoAsync(uri);
        const fileName = `voice_note_${Date.now()}.m4a`;

        // Create voice_notes directory if it doesn't exist
        const voiceNotesDir = `${FileSystem.documentDirectory}voice_notes/`;
        const dirInfo = await FileSystem.getInfoAsync(voiceNotesDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(voiceNotesDir, {
            intermediates: true,
          });
        }

        // Move to permanent location
        const permanentUri = `${voiceNotesDir}${fileName}`;
        await FileSystem.moveAsync({ from: uri, to: permanentUri });

        onRecordingComplete({
          uri: permanentUri,
          duration,
          fileSize: info.exists && 'size' in info ? info.size : 0,
          fileName,
        });
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording');
    }

    setRecording(null);
    setRecordingState('idle');
  };

  const cancelRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // Ignore errors when canceling
      }
    }

    setRecording(null);
    setRecordingState('idle');
    setDuration(0);
    onCancel?.();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = maxDuration - duration;

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatDuration(duration)}</Text>
        {recordingState === 'recording' && (
          <Text style={styles.remaining}>
            {formatDuration(remainingTime)} remaining
          </Text>
        )}
      </View>

      <View style={styles.controlsContainer}>
        {recordingState === 'idle' ? (
          <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
            <Ionicons name="mic" size={32} color="#fff" />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelRecording}
            >
              <Ionicons name="close" size={24} color="#ef4444" />
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
              </View>
            </Animated.View>

            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <Ionicons name="checkmark" size={24} color="#22c55e" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {recordingState === 'idle' && (
        <Text style={styles.hint}>Tap to start recording</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  remaining: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordingIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ef4444',
  },
  recordingDot: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 16,
  },
});
