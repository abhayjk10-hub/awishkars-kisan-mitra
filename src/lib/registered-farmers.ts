export interface RegisteredFarmerRecord {
  fullName?: string;
  password?: string;
  identifier?: string;
  phone?: string;
  email?: string;
  registeredAt?: string;
  updatedAt?: string;
}

function isRegisteredFarmerRecord(value: unknown): value is RegisteredFarmerRecord {
  if (typeof value !== 'object' || value === null) return false;

  return Object.values(value).every((field) => typeof field === 'string');
}

export function parseRegisteredFarmers(raw: string | null): RegisteredFarmerRecord[] {
  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.filter(isRegisteredFarmerRecord) : [];
}
