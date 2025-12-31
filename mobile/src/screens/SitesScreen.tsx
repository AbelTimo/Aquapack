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
import { getSitesByProject, LocalSite, getProjects } from '../services/database';

export default function SitesScreen({ navigation, route }: any) {
  const projectId = route?.params?.projectId;
  const projectName = route?.params?.projectName;

  const [sites, setSites] = useState<LocalSite[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadSites(selectedProject);
    }
  }, [selectedProject]);

  // Refresh when coming back to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (selectedProject) {
        loadSites(selectedProject);
      }
    });
    return unsubscribe;
  }, [navigation, selectedProject]);

  const loadInitialData = async () => {
    try {
      const loadedProjects = await getProjects();
      setProjects(loadedProjects);

      if (projectId) {
        setSelectedProject(projectId);
      } else if (loadedProjects.length > 0) {
        setSelectedProject(loadedProjects[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSites = async (projId: string) => {
    try {
      const loadedSites = await getSitesByProject(projId);
      setSites(loadedSites);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (selectedProject) {
      await loadSites(selectedProject);
    }
    setIsRefreshing(false);
  }, [selectedProject]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return '#22c55e';
      case 'PENDING':
        return '#f59e0b';
      case 'ERROR':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderSite = ({ item }: { item: LocalSite }) => (
    <TouchableOpacity
      style={styles.siteCard}
      onPress={() => navigation.navigate('SiteDetail', { siteId: item.id })}
    >
      <View style={styles.siteHeader}>
        <View style={styles.siteIcon}>
          <Ionicons name="location" size={24} color="#0891b2" />
        </View>
        <View style={styles.siteInfo}>
          <Text style={styles.siteName}>{item.name}</Text>
          <Text style={styles.siteCode}>{item.code}</Text>
        </View>
        <View style={[styles.syncBadge, { backgroundColor: getStatusColor(item.syncStatus) }]}>
          <Text style={styles.syncText}>
            {item.syncStatus === 'SYNCED' ? 'Synced' : item.syncStatus === 'PENDING' ? 'Pending' : 'Error'}
          </Text>
        </View>
      </View>
      <View style={styles.siteCoords}>
        <Ionicons name="navigate-outline" size={14} color="#6b7280" />
        <Text style={styles.coordsText}>
          {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
        </Text>
        {item.accuracy && (
          <Text style={styles.accuracyText}>±{item.accuracy.toFixed(0)}m</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  const currentProject = projects.find((p) => p.id === selectedProject);

  return (
    <View style={styles.container}>
      {/* Project Selector (only if not coming from specific project) */}
      {!projectId && projects.length > 1 && (
        <View style={styles.projectSelector}>
          <Text style={styles.projectLabel}>Project:</Text>
          <TouchableOpacity
            style={styles.projectDropdown}
            onPress={() => {
              // TODO: Implement project picker
            }}
          >
            <Text style={styles.projectDropdownText}>
              {currentProject?.name || 'Select Project'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Sites List */}
      <FlatList
        data={sites}
        renderItem={renderSite}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#0891b2']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Sites Yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to add your first site
            </Text>
          </View>
        }
      />

      {/* Add Site FAB */}
      {selectedProject && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            navigation.navigate('CreateSite', {
              projectId: selectedProject,
              projectName: currentProject?.name,
            })
          }
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
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
  },
  projectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  projectLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  projectDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  projectDropdownText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  siteCard: {
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
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ecfeff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  siteCode: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  syncBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  siteCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  coordsText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  accuracyText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
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
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

import { Platform } from 'react-native';
