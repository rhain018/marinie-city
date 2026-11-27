importScripts('./vendor/wasm_exec.js');

function decoded(base64) {
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

self.onmessage = async ({ data: { bytes, options, name } }) => {
  try {
    const response = await fetch('./vendor/sprite2model.wasm');
    if (!response.ok) throw new Error('The converter could not load.');
    const runtime = new Go();
    const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), runtime.importObject);
    void runtime.run(instance).catch((error) => self.postMessage({ error: error.message }));
    const result = JSON.parse(self.sprite2model.convert(new Uint8Array(bytes), JSON.stringify(options), name));
    if (result.error) throw new Error(result.error);
    const glb = decoded(result.glb);
    const preview = decoded(result.sides);
    self.postMessage({ glb: glb.buffer, preview: preview.buffer, report: result.report }, [glb.buffer, preview.buffer]);
  } catch (error) {
    self.postMessage({ error: error.message || 'Conversion failed.' });
  }
};
