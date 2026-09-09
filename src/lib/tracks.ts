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
    label: 'dachshund.land EP 1',
    coverColor: '#ec4899',
    coverAccent: '#2dd4bf',
    imageUrl: '/dachshu8ndecover.png',
    tracks: [
      { title: 'Little Longer One' },
      { title: 'Lullaby', url: 'https://www.youtube.com/watch?v=Is88ir6o8VA' },
      { title: 'My little longer Sister', url: 'https://www.youtube.com/watch?v=sl_wz25NQEY' },
      { title: 'I FOUND THE BEAT', url: 'https://www.youtube.com/watch?v=t_J8UanEFMs' },
      { title: 'Music loves me back', url: 'https://www.youtube.com/watch?v=ZH6OhwhbAgA' },
      { title: 'Reggae in my Paws', url: 'https://www.youtube.com/watch?v=NkU0yMjYTEE' },
      { title: 'Jazz in my Heart', url: 'https://www.youtube.com/watch?v=-M3Qb-vuSno' },
    ],
  },
  {
    id: 'dachshund.land-ep-2',
    label: 'dachshund.land EP 2',
    coverColor: '#f59e0b',
    coverAccent: '#f5f5f4',
    imageUrl: '/ChatGPT_Image_Aug_22,_2026,_12_14_02_PM.png',
    tracks: [
      { title: 'Date Nights' },
      { title: 'Littlelongerone out in the streets' },
      { title: 'Night out of town' },
      { title: 'RAP music around the fire' },
      { title: 'The crew' },
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
