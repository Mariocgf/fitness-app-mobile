export interface HealthItem {
  id: string;
  name: string;
  severity: 'Low' | 'Medium' | 'High';
}

export type Injury = HealthItem;
export type MedicalCondition = HealthItem;

export interface HealthProfilePayload {
  injuryIds: string[];
  medicalConditionIds: string[];
}
