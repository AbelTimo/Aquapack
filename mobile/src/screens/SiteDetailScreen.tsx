import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSiteById, getBoreholesBySite, getWaterLevelsBySite, LocalSite, LocalBorehole, LocalWaterLevel } from '../services/database';

export default function SiteDetailScreen({ navigation, route }: any) {
  const { siteId } = route.params;

  const [site, setSite] = useState<LocalSite | null>(null);
  const [boreholes, setBoreholes] = useState<LocalBorehole[]>([]);
  const [waterLevels, setWaterLevels] = useState<LocalWaterLevel[]>([]);

  useEffect(() => {
    loadData();
  }, [siteId]);

  // Refresh when coming back
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const loadedSite = await getSiteById(siteId);
    setSite(loadedSite);

    if (loadedSite) {
      const bh = await getBoreholesBySite(loadedSite.id);
      setBoreholes(bh);

      const wl = await getWaterLevelsBySite(loadedSite.id);
      setWaterLevels(wl);
    }
  };

  if (!site) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const ActionButton = ({
    icon,
    label,
    color,
    onPress,
  }: {
    icon: string;
    label: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color="#fff" />
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Site Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <Ionicons name="location" size={32} color="#0891b2" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.siteName}>{site.name}</Text>
            <Text style={styles.siteCode}>{site.code}</Text>
          </View>
        </View>

        <View style={styles.coordsBox}>
          <Ionicons name="navigate" size={16} color="#6b7280" />
          <Text style={styles.coordsText}>
            {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
          </Text>
          {site.accuracy && (
            <Text style={styles.accuracyText}>±{site.accuracy.toFixed(0)}m</Text>
          )}
        </View>

        {site.description && (
          <Text style={styles.description}>{site.description}</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Add Data</Text>
        <View style={styles.actionsGrid}>
          <ActionButton
            icon="layers"
            label="Borehole"
            color="#3b82f6"
            onPress={() => navigation.navigate('BoreholeForm', { siteId: site.id })}
          />
          <ActionButton
            icon="water"
            label="Water Level"
            color="#06b6d4"
            onPress={() => navigation.navigate('WaterLevelForm', { siteId: site.id, boreholes })}
          />
          <ActionButton
            icon="timer"
            label="Pump Test"
            color="#8b5cf6"
            onPress={() => navigation.navigate('PumpTest', { siteId: site.id, boreholes })}
          />
          <ActionButton
            icon="flask"
            label="Water Quality"
            color="#10b981"
            onPress={() => navigation.navigate('WaterQualityForm', { siteId: site.id, boreholes })}
          />
        </View>
      </View>

      {/* Boreholes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Boreholes ({boreholes.length})</Text>
        </View>
        {boreholes.length > 0 ? (
          boreholes.map((bh) => (
            <View key={bh.id} style={styles.dataCard}>
              <View style={styles.dataCardHeader}>
                <Ionicons name="layers" size={20} color="#3b82f6" />
                <Text style={styles.dataCardTitle}>{bh.name}</Text>
              </View>
              <Text style={styles.dataCardSub}>
                {bh.wellType} • Depth: {bh.totalDepth} {bh.depthUnit}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No boreholes recorded</Text>
        )}
      </View>

      {/* Water Levels */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Water Levels ({waterLevels.length})</Text>
        </View>
        {waterLevels.length > 0 ? (
          waterLevels.slice(0, 5).map((wl) => (
            <View key={wl.id} style={styles.dataCard}>
              <View style={styles.dataCardHeader}>
                <Ionicons name="water" size={20} color="#06b6d4" />
                <Text style={styles.dataCardTitle}>
                  {wl.depthToWater} {wl.depthUnit}
                </Text>
              </View>
              <Text style={styles.dataCardSub}>
                {new Date(wl.measurementDatetime).toLocaleString()} • {wl.measurementType}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No water level measurements</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#ecfeff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  siteCode: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  coordsText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dataCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dataCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  dataCardSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 28,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
