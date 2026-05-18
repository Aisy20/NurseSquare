/**
 * Curated Unsplash photo URLs and placeholder testimonial copy.
 *
 * The photos here are commonly-referenced Unsplash IDs of healthcare
 * workers chosen for visible diversity (race, gender, age). Swap for
 * your own brand photos before launch; these are licensed under
 * Unsplash's free license but you may prefer photos with explicit
 * model releases for marketing use.
 *
 * TODO before launch:
 * 1. Replace these URLs with photos you own or have licensed for
 *    commercial use with model releases.
 * 2. Replace the testimonial copy with real quotes from your beta
 *    users, with consent to use their first name + specialty.
 */

export interface PersonPhoto {
  url: string
  alt: string
  focal?: 'center' | 'top'
}

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`

export const HERO_PHOTO: PersonPhoto = {
  url: u('photo-1612531386530-97286d97c2d2', 1200),
  alt: 'Travel nurse in scrubs smiling, stethoscope around neck',
}

export const FEATURE_PHOTOS: PersonPhoto[] = [
  { url: u('photo-1559839734-2b71ea197ec2', 800), alt: 'Healthcare team collaborating in hospital corridor' },
  { url: u('photo-1576091160550-2173dba999ef', 800), alt: 'Clinician reviewing chart on tablet' },
  { url: u('photo-1584516150909-c43483ee7932', 800), alt: 'Nurse smiling in front of medical equipment' },
]

export interface Testimonial {
  name: string
  role: string
  location: string
  quote: string
  avatar: PersonPhoto
  accent: 'plum' | 'tang' | 'sage'
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Imani Okafor, RN',
    role: 'ICU travel nurse',
    location: 'Atlanta, GA',
    quote:
      'My recruiter promised $1,800/wk housing and the signed contract said $1,400. NurseSquare flagged the cut before I e-signed. That alone paid for the year.',
    avatar: { url: u('photo-1607746882042-944635dfe10e', 256), alt: 'Imani, ICU travel nurse' },
    accent: 'plum',
  },
  {
    name: 'Marcus Chen, RN',
    role: 'ER travel nurse',
    location: 'Seattle, WA',
    quote:
      'I used to track BLS, ACLS, NIHSS, and TB renewals in a Notes app. The Credential Wallet emails me 30 days out. Haven’t scrambled for a renewal since.',
    avatar: { url: u('photo-1559757175-5700dde675bc', 256), alt: 'Marcus, ER travel nurse' },
    accent: 'tang',
  },
  {
    name: 'Sofía Reyes, RN',
    role: 'L&D travel nurse',
    location: 'Phoenix, AZ',
    quote:
      'The diff page is the screenshot I send to every recruiter who tries to renegotiate after signing. They back off when they see numbers side by side.',
    avatar: { url: u('photo-1594824388853-2c5899ee14a7', 256), alt: 'Sofia, L&D travel nurse' },
    accent: 'sage',
  },
  {
    name: 'Priya Patel, RN',
    role: 'Cardiac ICU travel nurse',
    location: 'Boston, MA',
    quote:
      'I had three offers open at once. Uploaded all three PDFs and got a clean comparison in five minutes. Used to take me an evening with a spreadsheet.',
    avatar: { url: u('photo-1573497019418-b400bb3ab074', 256), alt: 'Priya, Cardiac ICU travel nurse' },
    accent: 'plum',
  },
]
