/**
 * Curated Unsplash photo URLs of healthcare workers.
 *
 * Photos chosen for visible diversity (race, gender, age). All under
 * Unsplash's free license. Before any commercial launch, swap for
 * photography you own or have licensed with model releases. The URLs
 * are centralized here so it's a one-file swap.
 */

export interface PersonPhoto {
  url: string
  alt: string
  caption?: string
}

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`

export const HERO_PHOTO: PersonPhoto = {
  url: u('photo-1612531386530-97286d97c2d2', 1200),
  alt: 'Travel nurse in scrubs smiling, stethoscope around neck',
}

export const ROLE_PHOTOS: PersonPhoto[] = [
  { url: u('photo-1559839734-2b71ea197ec2', 800), alt: 'Healthcare team in hospital corridor', caption: 'ICU · 12hr nights' },
  { url: u('photo-1576091160550-2173dba999ef', 800), alt: 'Clinician reviewing chart on tablet', caption: 'ER · 4x10s' },
  { url: u('photo-1584516150909-c43483ee7932', 800), alt: 'Nurse in front of medical equipment', caption: 'L&D · weekends' },
]
