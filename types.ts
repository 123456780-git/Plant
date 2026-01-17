
export interface PlantCare {
  water: string;
  light: string;
  soil: string;
  humidity: string;
  fertilizer: string;
}

export interface PlantMetrics {
  waterVolumeMl: string;
  maxHeightCm: string;
  optimalLuxRange: string;
}

export interface HealthDiagnosis {
  status: 'Healthy' | 'Stressed' | 'Critical';
  vitals: string;
  issues: string[];
  remedy: string;
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface RelatedSpecies {
  name: string;
  scientificName: string;
  reason: string;
}

export interface Reminder {
  id: string;
  plantId: string;
  plantName: string;
  task: string;
  frequency: string;
  lastDone: number;
  nextDue: number;
}

export interface PlantInfo {
  id: string;
  timestamp: number;
  image?: string;
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  description: string;
  toxicity: {
    isToxic: boolean;
    details: string;
  };
  care: PlantCare;
  metrics: PlantMetrics;
  diagnosis: HealthDiagnosis;
  funFact: string;
  groundingLinks?: GroundingLink[];
  relatedSpecies: RelatedSpecies[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type View = 'home' | 'about' | 'contact' | 'history' | 'signin' | 'signup' | 'reminders';
export type HomeSearchTab = 'global' | 'history';

export interface AppState {
  view: View;
  darkMode: boolean;
  isIdentifying: boolean;
  result: PlantInfo | null;
  error: string | null;
  history: PlantInfo[];
  user: { name: string; email: string } | null;
  isChatOpen: boolean;
  chatMessages: ChatMessage[];
  reminders: Reminder[];
  homeSearchTab: HomeSearchTab;
}
