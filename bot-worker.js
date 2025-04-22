self.onmessage = async ({ data: { botId, code } }) => {
  try {
    const startTime = performance.now();
    const func = new Function('return ' + code)();
    const result = await func();
    const runtime = performance.now() - startTime;
    self.postMessage({ botId, result, runtime });
  } catch (error) {
    self.postMessage({ botId, error: error.message });
  }
};
