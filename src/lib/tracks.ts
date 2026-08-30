export interface Track {
  title: string;
  duration?: string;
  coverUrl?: string;
  url?: string;
}

export interface EP {
  id: string;
  label: string;
  coverColor: string;
  coverAccent: string;
  imageUrl: string;
  tracks: Track[];
}

export const EPS: EP[] = [
  {
    id: 'dachshund.land',
    label: 'dachshund.land',
    coverColor: '#ec4899',
    coverAccent: '#2dd4bf',
    imageUrl: '/dachshu8ndecover.png',
    tracks: [
      { title: 'Little Longer One' },
      { title: 'Lullaby', url: 'https://www.youtube.com/watch?v=Is88ir6o8VA' },
      { title: 'My little longer Sister', url: 'https://www.youtube.com/watch?v=sl_wz25NQEY' },
      { title: 'I FOUND THE BEAT', url: 'https://www.youtube.com/watch?v=t_J8UanEFMs' },
      { title: 'Lullaby (Reprise)' },
      { title: 'Reggae in my Paws', url: 'https://www.youtube.com/watch?v=NkU0yMjYTEE' },
      { title: 'Jazz in my Heart', url: 'https://www.youtube.com/watch?v=-M3Qb-vuSno' },
    ],
  },
  {
    id: 'bunny.land',
    label: 'bunny.land',
    coverColor: '#2dd4bf',
    coverAccent: '#ec4899',
    imageUrl: '/bunnyland_cover.png',
    tracks: [
      { title: 'Launch Song 1' },
      { title: 'Launch Song 2' },
      { title: 'Launch Song 4' },
      { title: 'Launch Song 6' },
      { title: 'Greeting Song' },
      { title: 'Greeting Song 2' },
      { title: 'Reggae Greeting Song' },
      { title: 'Fue Noir Greeting Song' },
      { title: 'Bunny.land Voice Song' },
    ],
  },
];
