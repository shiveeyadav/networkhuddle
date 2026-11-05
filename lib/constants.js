// Shared, client-safe constants. Do not import server-only modules here.

export const SITE_NAME = 'NetworkHuddle';
export const SITE_TAGLINE = 'UK business networking that feels like a good conversation';
export const FREE_VISITS = 3;

export const REGIONS = [
  { value: 'london', label: 'London' },
  { value: 'south-east', label: 'South East' },
  { value: 'south-west', label: 'South West' },
  { value: 'east-of-england', label: 'East of England' },
  { value: 'east-midlands', label: 'East Midlands' },
  { value: 'west-midlands', label: 'West Midlands' },
  { value: 'yorkshire', label: 'Yorkshire & the Humber' },
  { value: 'north-west', label: 'North West' },
  { value: 'north-east', label: 'North East' },
  { value: 'wales', label: 'Wales' },
  { value: 'scotland', label: 'Scotland' },
  { value: 'northern-ireland', label: 'Northern Ireland' },
];

export const INDUSTRIES = [
  { value: 'accounting-finance', label: 'Accounting & finance' },
  { value: 'legal', label: 'Legal' },
  { value: 'marketing-creative', label: 'Marketing, design & creative' },
  { value: 'it-tech', label: 'IT & technology' },
  { value: 'property', label: 'Property & estate agency' },
  { value: 'health-wellbeing', label: 'Health & wellbeing' },
  { value: 'coaching-training', label: 'Coaching & training' },
  { value: 'hr-recruitment', label: 'HR & recruitment' },
  { value: 'hospitality-events', label: 'Hospitality & events' },
  { value: 'trades-construction', label: 'Trades & construction' },
  { value: 'retail-ecommerce', label: 'Retail & e-commerce' },
  { value: 'manufacturing', label: 'Manufacturing & engineering' },
  { value: 'insurance', label: 'Insurance & financial planning' },
  { value: 'charity', label: 'Charity & social enterprise' },
  { value: 'other', label: 'Other' },
];

export const FORMATS = [
  { value: 'online', label: 'Online meeting' },
  { value: 'speed', label: 'Speed networking' },
  { value: 'face2face', label: 'Face to face' },
];

export const THEMES = [
  { value: 'general', label: 'Open to all' },
  { value: 'b2b', label: 'B2B' },
  { value: 'women', label: 'Women in business' },
  { value: 'neuro-inclusive', label: 'Neuro-inclusive' },
  { value: 'money-matters', label: 'Money matters' },
  { value: 'cross-border', label: 'Cross-border' },
  { value: 'start-ups', label: 'Start-ups' },
];

export function labelFor(list, value) {
  const found = list.find((item) => item.value === value);
  return found ? found.label : '';
}
