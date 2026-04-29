import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";

interface LiveRideTrackerProps {
  rideId: string;
  rideType: 'solo' | 'group';
  participants?: Array<{
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  }>;
  onEndRide: () => void;
}

export default function LiveRideTracker({ 
  rideId, 
  rideType, 
  participants = [], 
  onEndRide 
}: LiveRideTrackerProps) {
  const { theme } = useTheme();
  const { rideStats, location, permission } = useRide();

  const formatSpeed = (speed: number) => {
    return Math.round(speed).toString();
  };

  const formatDistance = (distance: number) => {
    return distance.toFixed(1);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Live Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Gauge size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {formatSpeed(rideStats.currentSpeed)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              km/h
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <MapPin size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {formatDistance(rideStats.totalDistance)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              km
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Clock size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {rideStats.elapsedTime}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              time
            </Text>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStats}>
          <View style={styles.additionalStatItem}>
            <Text style={[styles.additionalStatLabel, { color: theme.textSecondary }]}>
              Avg Speed
            </Text>
            <Text style={[styles.additionalStatValue, { color: theme.textPrimary }]}>
              {formatSpeed(rideStats.averageSpeed)} km/h
            </Text>
          </View>
          <View style={styles.additionalStatItem}>
            <Text style={[styles.additionalStatLabel, { color: theme.textSecondary }]}>
              Max Speed
            </Text>
            <Text style={[styles.additionalStatValue, { color: theme.textPrimary }]}>
              {formatSpeed(rideStats.maxSpeed)} km/h
            </Text>
          </View>
        </View>
      </View>

      {/* Group Participants */}
      {rideType === 'group' && participants.length > 0 && (
        <View style={styles.participantsContainer}>
          <View style={styles.participantsHeader}>
            <Users size={20} color={theme.textPrimary} />
            <Text style={[styles.participantsTitle, { color: theme.textPrimary }]}>
              Co-riders ({participants.length})
            </Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.participantsList}>
              {participants.map((participant) => (
                <View key={participant.id} style={styles.participantItem}>
                  <View style={styles.participantAvatarContainer}>
                    <Image source={{ uri: participant.avatar }} style={styles.participantAvatar} />
                    <View style={[
                      styles.participantStatus,
                      { backgroundColor: participant.isOnline ? '#34C759' : '#FF3B30' }
                    ]} />
                  </View>
                  <Text style={[styles.participantName, { color: theme.textPrimary }]}>
                    {participant.name.split(' ')[0]}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* End Ride Button */}
      <TouchableOpacity
        style={[styles.endRideButton, { backgroundColor: theme.primary }]}
        onPress={onEndRide}
      >
        <Text style={styles.endRideButtonText}>
          End Ride
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  additionalStatItem: {
    alignItems: 'center',
  },
  additionalStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  additionalStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantsContainer: {
    marginBottom: 20,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantsList: {
    flexDirection: 'row',
    gap: 16,
  },
  participantItem: {
    alignItems: 'center',
    gap: 8,
  },
  participantAvatarContainer: {
    position: 'relative',
  },
  participantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  participantStatus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  participantName: {
    fontSize: 12,
    fontWeight: '500',
  },
  endRideButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  endRideButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});