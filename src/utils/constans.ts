
export const isWin = process.platform.startsWith('win');
export const isMac = process.platform === 'darwin';
export const isLinux = !isWin && !isMac;