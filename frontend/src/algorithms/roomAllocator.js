/**
 * Room Allocation Engine
 *
 * Constraints:
 * 1. Mutual Exclusion: A single room cannot host more than one examination during the same examination slot.
 * 2. Capacity: Room capacity must accommodate the subject's student count.
 * 3. Overcapacity Warning: If student count exceeds the largest available room or remaining rooms in that slot,
 *    a distinct warning status is flagged for the administrator.
 */

export function allocateRooms(subjects, assignments, rooms) {
  const roomList = [...(rooms || [])].sort((a, b) => a.capacity - b.capacity);
  const subjectMap = new Map((subjects || []).map(s => [s.id, s]));

  // Group subject IDs by assigned slot
  const slotGroups = new Map();
  for (const [subId, slot] of Object.entries(assignments || {})) {
    if (!slotGroups.has(slot)) {
      slotGroups.set(slot, []);
    }
    slotGroups.get(slot).push(subId);
  }

  const roomAllocations = {};
  const allocationWarnings = [];

  for (const [slot, subIds] of slotGroups.entries()) {
    // Sort subjects in this slot by student count descending (place largest classes first)
    const sortedSubjs = subIds
      .map(id => subjectMap.get(id))
      .filter(Boolean)
      .sort((a, b) => b.studentCount - a.studentCount);

    const availableRoomsInSlot = [...roomList];

    for (const subj of sortedSubjs) {
      // Find the smallest room that fits the subject (Best-Fit Decreasing)
      const roomIdx = availableRoomsInSlot.findIndex(r => r.capacity >= subj.studentCount);

      if (roomIdx !== -1) {
        const allocatedRoom = availableRoomsInSlot.splice(roomIdx, 1)[0];
        roomAllocations[subj.id] = {
          roomId: allocatedRoom.id,
          roomName: allocatedRoom.name,
          capacity: allocatedRoom.capacity,
          building: allocatedRoom.building,
          isSufficient: true,
          excessCapacity: allocatedRoom.capacity - subj.studentCount
        };
      } else {
        // No room in this slot has enough capacity
        // Assign the largest available room if any, else flag complete exhaustion
        if (availableRoomsInSlot.length > 0) {
          const largestAvail = availableRoomsInSlot.pop();
          const deficit = subj.studentCount - largestAvail.capacity;
          roomAllocations[subj.id] = {
            roomId: largestAvail.id,
            roomName: largestAvail.name,
            capacity: largestAvail.capacity,
            building: largestAvail.building,
            isSufficient: false,
            deficit,
            warning: `Deficit of ${deficit} seat(s). Subject requires ${subj.studentCount} seats; ${largestAvail.name} only holds ${largestAvail.capacity}.`
          };
          allocationWarnings.push({
            slot,
            subjectCode: subj.code,
            subjectName: subj.name,
            studentCount: subj.studentCount,
            assignedRoom: largestAvail.name,
            roomCapacity: largestAvail.capacity,
            message: `Overcapacity Warning: ${subj.code} (${subj.studentCount} students) exceeds ${largestAvail.name} capacity (${largestAvail.capacity}).`
          });
        } else {
          roomAllocations[subj.id] = {
            roomId: null,
            roomName: "No Room Available",
            capacity: 0,
            building: "N/A",
            isSufficient: false,
            warning: `All halls in Slot ${Number(slot) + 1} are occupied! Additional hall required.`
          };
          allocationWarnings.push({
            slot,
            subjectCode: subj.code,
            subjectName: subj.name,
            studentCount: subj.studentCount,
            assignedRoom: "None",
            roomCapacity: 0,
            message: `Room Shortage: Insufficient halls configured for ${subj.code} in Slot ${Number(slot) + 1}.`
          });
        }
      }
    }
  }

  return {
    roomAllocations,
    allocationWarnings,
    hasWarnings: allocationWarnings.length > 0
  };
}

