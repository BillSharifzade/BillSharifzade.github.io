// Each site's own logo, taken from the live site (or, for Smart City, whose
// site was unreachable, from the project's repo) and made white on transparent.
// `?no-inline` keeps them out of the JS bundle: they are only needed when the
// Live sites window is open. width/height are the files' own pixel sizes;
// `weight` shrinks a logo whose heavy letters look bigger than their area.
import technohub from '../assets/live/technohub.webp?no-inline'
import kit from '../assets/live/kit.webp?no-inline'
import koinotinav from '../assets/live/koinotinav.svg?no-inline'
import koinotinavJob from '../assets/live/koinotinav-job.svg?no-inline'
import dsc from '../assets/live/dsc.webp?no-inline'
import ats from '../assets/live/ats.webp?no-inline'
import velve from '../assets/live/velve.webp?no-inline'
// The brand kit's mono logo in white, like the others.
import mintaka from '../assets/live/mintaka.svg?no-inline'
import { MINTAKA } from './mintaka.js'

// Sites Bilol has built that are live today, for the "Live sites" window in
// Selected Projects. A few of many; the rest aren't public.
export const liveSites = [
  {
    title: 'Mintaka',
    logo: { src: mintaka, width: 519, height: 155 },
    kind: 'My studio',
    blurb: 'The studio I founded, with a lab that measures every claim live.',
    url: MINTAKA.studio,
  },
  {
    title: 'TechnoHub',
    logo: { src: technohub, width: 441, height: 96 },
    kind: 'IT academy',
    blurb: 'IT school in Dushanbe: programming, design, Excel and English, with job-search help.',
    url: 'https://technohub.tj/',
  },
  {
    title: 'KIT',
    logo: { src: kit, width: 120, height: 96 },
    kind: 'Data center',
    blurb: 'Dushanbe data center: server hosting and cloud, plus 1C and BPM setup.',
    url: 'https://kit.tj/',
  },
  {
    title: 'Koinoti Nav',
    logo: { src: koinotinav, width: 190, height: 32 },
    kind: 'Holding group',
    blurb: 'A Tajik holding with companies in pharma, retail, automotive and education.',
    url: 'https://koinotinav.tj/',
  },
  {
    title: 'Koinoti Nav Careers',
    logo: { src: koinotinavJob, width: 215, height: 26, weight: 0.82 },
    kind: 'Job board',
    blurb: 'Vacancies across the group’s companies, with online applications.',
    url: 'https://job.koinotinav.tj/',
  },
  {
    title: 'Smart City Dushanbe',
    logo: { src: dsc, width: 240, height: 96 },
    kind: 'E-government',
    blurb: 'The city’s Smart City enterprise: digital services, news and feedback.',
    url: 'https://dsc.tj/',
  },
  {
    title: 'AtS Booking',
    logo: { src: ats, width: 72, height: 72 },
    kind: 'Telegram Mini App',
    blurb: 'Staff book training rooms and events at the AtS centre and leave feedback.',
    url: 'https://dchr.koinotinav.com/ats/',
  },
  {
    title: 'Velvé',
    logo: { src: velve, width: 356, height: 96 },
    kind: 'Brand concept',
    blurb: 'Concept site for a five-product cosmetics line and what goes into each.',
    url: 'https://billsharifzade.github.io/beauty/',
  },
]
