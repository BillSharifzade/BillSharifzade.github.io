import apiweave from '../assets/projects/apiweave.svg'
import screenx1 from '../assets/projects/screenx1.jpg'
import screenx2 from '../assets/projects/screenx2.jpg'
import hrProgress from '../assets/projects/hr-progress.jpg'
import tekDesktop from '../assets/projects/tek-desktop.webp'
import tekPhone from '../assets/projects/tek-phone.webp'
import paymentDesktop from '../assets/projects/payment-desktop.webp'
import paymentPhone from '../assets/projects/payment-phone.webp'

// Screenshots per project. A `phone` shot is drawn as a handset over the
// desktop one.
export const projectCovers = {
  apiweave: [apiweave],
  screenx: [screenx1, screenx2],
  'hr-progress': [hrProgress],
  tek: [tekDesktop, { src: tekPhone, phone: true }],
  payment: [paymentDesktop, { src: paymentPhone, phone: true }],
}
