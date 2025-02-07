export interface Skill {
  name: string;
  proficiencyLevel: number;
}

export interface Role {
  id: string;
  label: string;
  category: string;
}

export interface SkillLevel {
  value: number;
  label: string;
}
