// Mock crypto.randomUUID if needed in jsdom
if (!globalThis.crypto) {
  // @ts-expect-error mock crypto in test env
  globalThis.crypto = {};
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => '10000000-1000-4000-8000-100000000000';
}
