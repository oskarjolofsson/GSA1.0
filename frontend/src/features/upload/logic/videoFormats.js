/**
 * Video format constants and signatures
 */

// MOV (QuickTime) brands - includes iPhone recordings
export const MOV_BRANDS = ['qt  '];

// MP4 and HEVC brands (includes iPhone HEVC videos)
export const MP4_BRANDS = [
  'isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6',  // ISO base media
  'mp41', 'mp42', 'mp71',                          // MP4 versions
  'avc1', 'avc2', 'avc3', 'avc4',                  // H.264/AVC
  'hvc1', 'hev1', 'hevc',                          // H.265/HEVC (iPhone)
  'M4V ', 'M4VH', 'M4VP',                          // Apple M4V
  'mmp4',                                           // Mobile MP4
  'MSNV',                                           // Sony
  'ndas', 'ndsc', 'ndsh', 'ndsm', 'ndsp', 'ndss',  // MPEG-DASH
  'dash',                                           // DASH
];

// ISO BMFF (MP4 / MOV) signature
export const ISO_BMFF_SIGNATURE = {
  offset: 4,
  bytes: [0x66, 0x74, 0x79, 0x70], // 'ftyp'
  minLength: 12
};

// WebM signature
export const WEBM_SIGNATURE = {
  offset: 0,
  bytes: [0x1A, 0x45, 0xDF, 0xA3],
  minLength: 4
};
