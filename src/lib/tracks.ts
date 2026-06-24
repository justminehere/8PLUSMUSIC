export interface Track {
  title: string;
  duration?: string;
  coverUrl?: string;
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
      { title: 'Song 1' },
      { title: 'Song 2' },
      { title: 'R&B Song' },
      { title: 'Lullaby' },
      { title: 'Reggae Song' },
      { title: 'Jazz Song' },
      { title: 'Little Longer One' },
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
