/**
 * Curated Unsplash photo URLs of healthcare workers.
 *
 * Photos chosen for visible diversity (race, religion/modest dress,
 * gender, and care settings). All are free Unsplash photos. Before any
 * commercial launch, swap for photography you own or have licensed with
 * model releases. The URLs are centralized here so it's a one-file swap.
 */

export interface PersonPhoto {
  url: string
  alt: string
  caption?: string
}

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`

const pexels = (id: string, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`

export const HERO_PHOTO: PersonPhoto = {
  url: pexels('19963130', 1200),
  alt: 'Young Black nurse in teal scrubs smiling with a stethoscope',
}

export const LOGIN_PHOTO: PersonPhoto = {
  url: u('photo-1584515933487-779824d29309', 1200),
  alt: 'Diverse healthcare team in a hospital corridor',
}

export const ROLE_PHOTOS: PersonPhoto[] = [
  {
    url: u('photo-1737792837727-fd46ff71acf2', 900),
    alt: 'Muslim nurse wearing a hijab and medical mask',
    caption: 'ER · verified',
  },
  {
    url: pexels('4930705', 900),
    alt: 'Young nurse in blue scrubs smiling with a stethoscope in a hospital corridor',
    caption: 'ICU · nights',
  },
  {
    url: u('photo-1584515933487-779824d29309', 900),
    alt: 'Diverse group of healthcare workers in hospital hallway',
    caption: 'Team care',
  },
]
