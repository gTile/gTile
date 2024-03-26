const fnIdentities = {
  log: console.log,
  debug: console.debug,
  error: console.error,
  info: console.info,
  warn: console.warn,
}

export const supressLogging = () => {
  console.log = console.debug = console.error = console.info = console.warn =
    () => { };
}

export const unsuppressLogging = () => {
  console.log = fnIdentities.log;
  console.debug = fnIdentities.debug;
  console.error = fnIdentities.error;
  console.info = fnIdentities.info;
  console.warn = fnIdentities.warn;
}
