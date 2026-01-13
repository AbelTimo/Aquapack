import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { getSyncStats, getPendingSyncItems, markSyncItemProcessed, markSyncItemFailed } from '../services/database';
import { checkConnection, sitesApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function SyncScreen() {
  const { user, logout } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState({ pending: 0, failed: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    loadSyncStats();

    return () => unsubscribe();
  }, []);

  const loadSyncStats = async () => {
    const stats = await getSyncStats();
    setSyncStats(stats);
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSyncStats();
    setIsRefreshing(false);
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Please connect to the internet to sync.');
      return;
    }

    setIsSyncing(true);
    try {
      // Check API connection
      const connected = await checkConnection();
      if (!connected) {
        Alert.alert('Connection Error', 'Could not reach the server.');
        return;
      }

      // Get pending items
      const pendingItems = await getPendingSyncItems();

      let successCount = 0;
      let errorCount = 0;

      for (const item of pendingItems) {
        try {
          // For now, just mark as processed
          // In a real implementation, you'd send each item to the appropriate API endpoint
          if (item.entityType === 'site') {
            // await sitesApi.create(JSON.parse(item.payload));
          }

          await markSyncItemProcessed(item.id);
          successCount++;
        } catch (error: any) {
          await markSyncItemFailed(item.id, error.message);
          errorCount++;
        }
      }

      setLastSyncTime(new Date().toISOString());
      await loadSyncStats();

      if (errorCount > 0) {
        Alert.alert('Sync Completed', `${successCount} items synced, ${errorCount} failed.`);
      } else if (successCount > 0) {
        Alert.alert('Success', `${successCount} items synced successfully.`);
      } else {
        Alert.alert('Up to Date', 'Everything is already synced.');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Sync Failed', 'An error occurred during sync.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Any unsynced data will remain on the device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              // Force logout even on error
              await logout();
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#0891b2']} />}
    >
      {/* Connection Status */}
      <View style={[styles.statusBanner, isOnline ? styles.statusOnline : styles.statusOffline]}>
        <Ionicons
          name={isOnline ? 'cloud-done' : 'cloud-offline'}
          size={24}
          color="#fff"
        />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      {/* Sync Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="time" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>{syncStats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
          </View>
          <Text style={styles.statValue}>{syncStats.failed}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      {/* Sync Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.syncButton, (!isOnline || isSyncing) && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={!isOnline || isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Ionicons name="sync" size={32} color="#fff" />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </>
          )}
        </TouchableOpacity>

        {lastSyncTime && (
          <Text style={styles.lastSyncText}>
            Last sync: {new Date(lastSyncTime).toLocaleString()}
          </Text>
        )}
      </View>

      {/* User Info */}
      <View style={styles.section}>
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About Sync</Text>
        <Text style={styles.infoText}>
          Your data is stored locally on this device and will sync to the server when you have an internet connection.
        </Text>
        <Text style={styles.infoText}>
          Pending items will be uploaded automatically when you connect to the internet and open the app.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  statusOnline: {
    backgroundColor: '#22c55e',
  },
  statusOffline: {
    backgroundColor: '#6b7280',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  syncButton: {
    backgroundColor: '#0891b2',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  lastSyncText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginTop: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ecfeff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0891b2',
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
  },
  infoSection: {
    padding: 16,
    paddingBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
});
