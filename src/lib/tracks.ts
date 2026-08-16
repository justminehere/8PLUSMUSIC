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
      { title: 'Lullaby', url: 'https://www.youtube.com/watch?v=Is88ir6o8VA' },
      { title: 'Song 2' },
      { title: 'R&B Song' },
      { title: 'Lullaby (Reprise)' },
      { title: 'Reggae Song' },
      { title: 'Jazz in my Heart', url: 'https://www.youtube.com/watch?v=-M3Qb-vuSno' },
      { title: 'Little Longer One', url: 'https://music.youtube.com/watch?v=TqH1G6M4k0I' },
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
