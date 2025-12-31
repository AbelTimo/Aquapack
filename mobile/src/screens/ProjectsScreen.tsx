import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { projectsApi } from '../services/api';
import { getProjects, saveProjects, LocalProject } from '../services/database';

export default function ProjectsScreen({ navigation }: any) {
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    loadProjects();

    return () => unsubscribe();
  }, []);

  const loadProjects = async () => {
    try {
      // First load from local DB
      const localProjects = await getProjects();
      setProjects(localProjects);

      // Then try to sync from server
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await syncProjects();
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncProjects = async () => {
    try {
      const response = await projectsApi.getMyProjects();
      const serverProjects = response.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        client: p.client,
        region: p.region,
        description: p.description,
        isActive: p.isActive ? 1 : 0,
        userRole: p.userRole,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      await saveProjects(serverProjects);
      setProjects(serverProjects);
    } catch (error) {
      console.error('Failed to sync projects:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadProjects();
    setIsRefreshing(false);
  }, []);

  const renderProject = ({ item }: { item: LocalProject }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => navigation.navigate('Sites', { projectId: item.id, projectName: item.name })}
    >
      <View style={styles.projectHeader}>
        <View style={styles.projectIcon}>
          <Ionicons name="folder" size={24} color="#0891b2" />
        </View>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.name}</Text>
          <Text style={styles.projectCode}>{item.code}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
      </View>
      {item.client && (
        <Text style={styles.projectClient}>Client: {item.client}</Text>
      )}
      {item.region && (
        <Text style={styles.projectRegion}>Region: {item.region}</Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.offlineText}>Offline - Using cached data</Text>
        </View>
      )}

      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#0891b2']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Projects</Text>
            <Text style={styles.emptyText}>
              {isOnline
                ? 'No projects assigned to you yet.'
                : 'Connect to internet to sync projects.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ecfeff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  projectCode: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  projectClient: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  projectRegion: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
