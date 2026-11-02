// The "My skills" folders (components/FolderFloat.jsx). Each skill is a pill
// with the logos named here (keys of SKILL_LOGOS in skillLogos.js).
// `arrangements` is how a folder's pills settle when it opens, in order of
// preference: the first that fits the screen wins.
export const SKILL_FOLDERS = [
  {
    label: 'Rust',
    icon: 'rust',
    arrangements: ['arch', 'stairs-left'],
    items: [
      { name: 'Axum, Actix', logos: ['actix'] },
      { name: 'Tauri, Ratatui', logos: ['tauri', 'ratatui'] },
      { name: 'Tokio', logos: ['tokio'] },
    ],
  },
  {
    label: 'Web',
    icon: 'js-square',
    arrangements: ['stairs'],
    items: [
      { name: 'React & React Native', logos: ['react'] },
      { name: 'Typescript', logos: ['typescript'] },
      { name: 'NextJS', logos: ['nextdotjs'] },
    ],
  },
  {
    label: 'Linux',
    icon: 'linux',
    arrangements: ['zigzag'],
    items: [
      { name: 'Arch, Gentoo, Kali', logos: ['archlinux', 'gentoo', 'kalilinux'] },
      { name: 'Kernel, Systemd, Syscalls', logos: ['linux'] },
      { name: 'Unix Philosophy', logos: ['gnubash'] },
    ],
  },
  {
    label: 'Python',
    icon: 'python',
    arrangements: ['pyramid', 'scatter'],
    items: [
      { name: 'NumPy/Pandas', logos: ['numpy', 'pandas'] },
      { name: 'Django & FastAPI', logos: ['django', 'fastapi'] },
      { name: 'TensorFlow', logos: ['tensorflow'] },
    ],
  },
  {
    label: 'Security & Crypto',
    icon: 'shield-alt',
    arrangements: ['scatter'],
    items: [
      { name: 'Cybersecurity, AppSec', logos: ['owasp'] },
      { name: 'Cryptography', logos: ['gnuprivacyguard'] },
      { name: 'Network Security', logos: ['wireshark'] },
    ],
  },
  {
    label: 'Low-level',
    icon: 'microchip',
    arrangements: ['cloud', 'tower'],
    items: [
      { name: 'C (OpenGL, Vulkan)', logos: ['c', 'opengl', 'vulkan'] },
      { name: 'Zig', logos: ['zig'] },
      { name: 'Assembly', logos: ['riscv'] },
    ],
  },
]
