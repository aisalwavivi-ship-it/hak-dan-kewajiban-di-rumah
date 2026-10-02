/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TimeOfDay = 'pagi' | 'siang' | 'malam';

export type RoomId = 'kamar-tidur' | 'ruang-tamu' | 'dapur' | 'kamar-mandi' | 'taman';

export type AdventureNodeId = 'start' | 'ruang-tamu' | 'kamar-tidur' | 'dapur' | 'kamar-mandi' | 'taman' | 'complete';

export const ADVENTURE_ORDER: RoomId[] = [
  'ruang-tamu',
  'kamar-tidur',
  'dapur',
  'kamar-mandi',
  'taman',
];

export type ConceptType = 'hak' | 'kewajiban';

export interface SituationItem {
  id: string;
  code: 'A' | 'B';
  title: string;
  description: string;
  type: ConceptType;
  /**
   * Path to image asset, placeholder illustration, or video URL.
   * Can be easily swapped in `src/data/houseData.ts`.
   */
  imageSrc?: string;
  videoSrc?: string;
  visualPlaceholder: {
    themeColor: string;
    iconEmoji: string;
    roomObject: string;
    badgeTag: string;
  };
  explanation: string;
  hint: string;
}

export interface RoomMission {
  situationA: SituationItem;
  situationB: SituationItem;
  teacherQuestion: string;
  timeContext: string;
}

export interface RoomData {
  id: RoomId;
  name: string;
  subtitle: string;
  shortDesc: string;
  colorTheme: {
    primary: string;
    light: string;
    border: string;
    accent: string;
    text: string;
  };
  // Characteristic furniture/objects in room
  features: string[];
  // Relevance description for each time
  timeRelevance: Record<TimeOfDay, {
    isPriority: boolean;
    hintBadge: string;
    contextNote: string;
  }>;
  // Missions tied to each time of day
  missions: Record<TimeOfDay, RoomMission>;
}

export interface UserProgress {
  exploredRooms: Record<RoomId, boolean>;
  solvedMissions: Record<string, boolean>; // key: `${roomId}_${timeOfDay}`
  discoveredHakCount: number;
  discoveredKewajibanCount: number;
}
