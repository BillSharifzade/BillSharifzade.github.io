/**
 * The logos on the skill pills (see skillFolders.js), from simple-icons.
 *
 * FolderFloat loads this module on its own once the browser is idle: the
 * logos are ~11 kB gzipped, more than the folders themselves, and nobody sees
 * them until a folder opens. Each logo is imported as its own SVG file, since
 * importing from 'simple-icons' would put them in the module the main bundle
 * already loads for the project icons. The ones it already has are reused.
 */
import actix from 'simple-icons/icons/actix.svg?raw'
import archlinux from 'simple-icons/icons/archlinux.svg?raw'
import django from 'simple-icons/icons/django.svg?raw'
import fastapi from 'simple-icons/icons/fastapi.svg?raw'
import gentoo from 'simple-icons/icons/gentoo.svg?raw'
import gnubash from 'simple-icons/icons/gnubash.svg?raw'
import gnuprivacyguard from 'simple-icons/icons/gnuprivacyguard.svg?raw'
import kalilinux from 'simple-icons/icons/kalilinux.svg?raw'
import numpy from 'simple-icons/icons/numpy.svg?raw'
import opengl from 'simple-icons/icons/opengl.svg?raw'
import owasp from 'simple-icons/icons/owasp.svg?raw'
import pandas from 'simple-icons/icons/pandas.svg?raw'
import ratatui from 'simple-icons/icons/ratatui.svg?raw'
import riscv from 'simple-icons/icons/riscv.svg?raw'
import tauri from 'simple-icons/icons/tauri.svg?raw'
import tensorflow from 'simple-icons/icons/tensorflow.svg?raw'
import tokio from 'simple-icons/icons/tokio.svg?raw'
import vulkan from 'simple-icons/icons/vulkan.svg?raw'
import wireshark from 'simple-icons/icons/wireshark.svg?raw'
import zig from 'simple-icons/icons/zig.svg?raw'
import { projectIcons } from './projectIcons.js'

const pathOf = (svg) => svg.match(/ d="([^"]+)"/)[1]

// Every simple-icons logo is drawn on a 24×24 grid.
export const SKILL_LOGOS = {
  ...Object.fromEntries(
    Object.entries({
      actix,
      archlinux,
      django,
      fastapi,
      gentoo,
      gnubash,
      gnuprivacyguard,
      kalilinux,
      numpy,
      opengl,
      owasp,
      pandas,
      ratatui,
      riscv,
      tauri,
      tensorflow,
      tokio,
      vulkan,
      wireshark,
      zig,
    }).map(([slug, svg]) => [slug, pathOf(svg)])
  ),
  c: projectIcons.siC.path,
  linux: projectIcons.siLinux.path,
  nextdotjs: projectIcons.siNextdotjs.path,
  react: projectIcons.siReact.path,
  typescript: projectIcons.siTypescript.path,
}
