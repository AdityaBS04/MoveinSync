/**
 * Conflict Analyzer Service
 * Intelligent conflict detection and resolution for floor plan versions
 * Strategy: Priority-based + Timestamp-based auto-merge
 */

class ConflictAnalyzer {
  /**
   * Analyze conflicts between base floor plan and pending versions
   */
  analyzeVersions(baseFloorPlan, pendingVersions) {
    const conflicts = [];
    const safeChanges = [];
    const roomChanges = new Map(); // room_id -> [changes]

    // Group all changes by room ID
    pendingVersions.forEach(version => {
      const versionRooms = version.rooms || [];

      versionRooms.forEach(room => {
        if (!roomChanges.has(room.id)) {
          roomChanges.set(room.id, []);
        }
        roomChanges.set(room.id, [...roomChanges.get(room.id), {
          room,
          version,
          versionId: version.id,
          creator: version.creator_name,
          priority: version.creator_priority,
          timestamp: new Date(version.created_at).getTime()
        }]);
      });
    });

    // Analyze each room
    const baseRooms = new Map((baseFloorPlan.rooms || []).map(r => [r.id, r]));

    roomChanges.forEach((changes, roomId) => {
      const baseRoom = baseRooms.get(roomId);

      if (changes.length === 1) {
        // Single change - safe to apply
        safeChanges.push({
          type: 'single_change',
          roomId,
          change: changes[0],
          action: baseRoom ? 'modify' : 'add'
        });
      } else {
        // Multiple changes - need conflict resolution
        const conflictAnalysis = this.analyzeRoomConflict(baseRoom, changes);

        if (conflictAnalysis.canAutoResolve) {
          safeChanges.push(conflictAnalysis.resolution);
        } else {
          conflicts.push(conflictAnalysis);
        }
      }
    });

    // Check for deletions (rooms in base but not in any version)
    baseRooms.forEach((room, roomId) => {
      const hasChanges = roomChanges.has(roomId);
      const allVersionsDeletedIt = pendingVersions.every(v =>
        !v.rooms.some(r => r.id === roomId)
      );

      if (allVersionsDeletedIt && hasChanges) {
        conflicts.push({
          type: 'deletion_conflict',
          roomId,
          baseRoom: room,
          versions: pendingVersions.filter(v => !v.rooms.some(r => r.id === roomId))
        });
      }
    });

    return {
      conflicts,
      safeChanges,
      canAutoMerge: conflicts.length === 0,
      totalConflicts: conflicts.length,
      totalSafeChanges: safeChanges.length
    };
  }

  /**
   * Analyze conflict for a specific room with multiple changes
   */
  analyzeRoomConflict(baseRoom, changes) {
    // Check if changes are to different properties (non-overlapping)
    const propertyChanges = this.groupChangesByProperty(baseRoom, changes);

    if (this.areChangesNonOverlapping(propertyChanges)) {
      // Merge all changes (different properties changed)
      return {
        type: 'non_overlapping',
        canAutoResolve: true,
        resolution: {
          type: 'merge_properties',
          roomId: changes[0].room.id,
          mergedRoom: this.mergeNonOverlappingChanges(baseRoom, changes)
        }
      };
    }

    // Same property changed differently - use priority + timestamp
    const winner = this.resolveByPriorityAndTimestamp(changes);

    return {
      type: 'overlapping_changes',
      canAutoResolve: true,
      resolution: {
        type: 'priority_timestamp',
        roomId: changes[0].room.id,
        winner: winner,
        losers: changes.filter(c => c !== winner),
        reason: winner.resolutionReason
      },
      details: {
        property: propertyChanges.overlappingProperty,
        changes: changes.map(c => ({
          value: c.room,
          creator: c.creator,
          priority: c.priority,
          timestamp: c.timestamp
        }))
      }
    };
  }

  /**
   * Group changes by which properties they modify
   */
  groupChangesByProperty(baseRoom, changes) {
    const propertyMap = new Map();

    changes.forEach(change => {
      const modifiedProps = this.getModifiedProperties(baseRoom, change.room);
      modifiedProps.forEach(prop => {
        if (!propertyMap.has(prop)) {
          propertyMap.set(prop, []);
        }
        propertyMap.set(prop, [...propertyMap.get(prop), change]);
      });
    });

    return propertyMap;
  }

  /**
   * Get list of properties that were modified
   */
  getModifiedProperties(baseRoom, changedRoom) {
    if (!baseRoom) return ['*']; // New room - all properties are "changes"

    const modified = [];

    if (baseRoom.x !== changedRoom.x || baseRoom.y !== changedRoom.y) {
      modified.push('position');
    }
    if (baseRoom.name !== changedRoom.name) {
      modified.push('name');
    }
    if (baseRoom.type !== changedRoom.type) {
      modified.push('type');
    }

    return modified;
  }

  /**
   * Check if changes are non-overlapping (different properties)
   */
  areChangesNonOverlapping(propertyMap) {
    // If all properties have only 1 change, they're non-overlapping
    for (const [prop, changes] of propertyMap) {
      if (changes.length > 1) {
        return false; // Same property changed by multiple people
      }
    }
    return propertyMap.size > 0;
  }

  /**
   * Merge non-overlapping changes into single room object
   */
  mergeNonOverlappingChanges(baseRoom, changes) {
    const merged = { ...(baseRoom || changes[0].room) };

    changes.forEach(change => {
      const modifiedProps = this.getModifiedProperties(baseRoom, change.room);
      modifiedProps.forEach(prop => {
        if (prop === 'position') {
          merged.x = change.room.x;
          merged.y = change.room.y;
        } else if (prop === 'name') {
          merged.name = change.room.name;
        } else if (prop === 'type') {
          merged.type = change.room.type;
        }
      });
    });

    return merged;
  }

  /**
   * Resolve conflict using priority and timestamp
   * Rule: Lower priority number = higher priority
   * If equal priority, latest timestamp wins
   */
  resolveByPriorityAndTimestamp(changes) {
    let winner = changes[0];
    let reason = '';

    for (let i = 1; i < changes.length; i++) {
      const challenger = changes[i];

      // Compare priority (lower number = higher priority)
      if (challenger.priority < winner.priority) {
        winner = challenger;
        reason = `higher_priority (${challenger.priority} vs ${winner.priority})`;
      } else if (challenger.priority === winner.priority) {
        // Same priority - compare timestamps (latest wins)
        if (challenger.timestamp > winner.timestamp) {
          winner = challenger;
          reason = `latest_timestamp (same priority ${challenger.priority})`;
        }
      }
    }

    winner.resolutionReason = reason || `highest_priority (${winner.priority})`;
    return winner;
  }

  /**
   * Auto-merge multiple versions into base floor plan
   */
  autoMerge(baseFloorPlan, pendingVersions) {
    const analysis = this.analyzeVersions(baseFloorPlan, pendingVersions);

    if (!analysis.canAutoMerge) {
      return {
        success: false,
        message: 'Cannot auto-merge - manual conflict resolution required',
        conflicts: analysis.conflicts
      };
    }

    // Apply all safe changes
    const mergedRooms = new Map((baseFloorPlan.rooms || []).map(r => [r.id, { ...r }]));

    analysis.safeChanges.forEach(change => {
      if (change.type === 'single_change' || change.type === 'priority_timestamp') {
        const room = change.change?.room || change.winner?.room;
        mergedRooms.set(change.roomId, room);
      } else if (change.type === 'merge_properties') {
        mergedRooms.set(change.roomId, change.mergedRoom);
      }
    });

    // Check for new rooms from all versions
    pendingVersions.forEach(version => {
      (version.rooms || []).forEach(room => {
        if (!mergedRooms.has(room.id) && !this.overlapsExistingRoom(room, Array.from(mergedRooms.values()))) {
          mergedRooms.set(room.id, room);
        }
      });
    });

    return {
      success: true,
      mergedFloorPlan: {
        ...baseFloorPlan,
        rooms: Array.from(mergedRooms.values()),
        version: baseFloorPlan.version + 1
      },
      appliedChanges: analysis.safeChanges,
      mergedVersionCount: pendingVersions.length
    };
  }

  /**
   * Check if new room overlaps with existing rooms
   */
  overlapsExistingRoom(newRoom, existingRooms) {
    const ROOM_TYPES = {
      meeting_room: { width: 150, height: 100 },
      conference_room: { width: 200, height: 150 },
      washroom: { width: 80, height: 80 },
      stairs: { width: 100, height: 60 },
      elevator: { width: 80, height: 80 },
      staff_room: { width: 120, height: 100 },
      pantry: { width: 100, height: 80 },
      storage: { width: 90, height: 90 }
    };

    const newConfig = ROOM_TYPES[newRoom.type] || { width: 100, height: 100 };

    return existingRooms.some(existing => {
      if (existing.id === newRoom.id) return false; // Same room

      const existingConfig = ROOM_TYPES[existing.type] || { width: 100, height: 100 };

      // Check for overlap
      return !(
        newRoom.x + newConfig.width < existing.x ||
        newRoom.x > existing.x + existingConfig.width ||
        newRoom.y + newConfig.height < existing.y ||
        newRoom.y > existing.y + existingConfig.height
      );
    });
  }

  /**
   * Generate conflict report for UI display
   */
  generateConflictReport(analysis) {
    return {
      summary: {
        totalConflicts: analysis.totalConflicts,
        totalSafeChanges: analysis.totalSafeChanges,
        canAutoMerge: analysis.canAutoMerge
      },
      conflicts: analysis.conflicts.map(c => ({
        type: c.type,
        roomId: c.roomId,
        description: this.getConflictDescription(c),
        needsManualReview: !c.canAutoResolve,
        suggestedResolution: c.resolution
      })),
      safeChanges: analysis.safeChanges.map(c => ({
        type: c.type,
        roomId: c.roomId,
        description: this.getChangeDescription(c)
      }))
    };
  }

  /**
   * Get human-readable conflict description
   */
  getConflictDescription(conflict) {
    switch (conflict.type) {
      case 'overlapping_changes':
        return `Multiple admins modified the same room properties`;
      case 'deletion_conflict':
        return `Room deleted in one version, modified in another`;
      case 'position_overlap':
        return `New room position overlaps with existing room`;
      default:
        return 'Unknown conflict type';
    }
  }

  /**
   * Get human-readable change description
   */
  getChangeDescription(change) {
    switch (change.type) {
      case 'single_change':
        return `${change.action === 'add' ? 'New room added' : 'Room modified'} by ${change.change.creator}`;
      case 'priority_timestamp':
        return `Resolved using ${change.winner.resolutionReason}`;
      case 'merge_properties':
        return `Merged non-overlapping changes to room`;
      default:
        return 'Change applied';
    }
  }
}

module.exports = new ConflictAnalyzer();
