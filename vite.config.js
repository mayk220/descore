import react from "@vitejs/plugin-react";
import { createInstrumenter } from "istanbul-lib-instrument";
import { defineConfig } from "vite";

function coverageInstrumentation() {
  return {
    name: "coverage-instrumentation",
    enforce: "post",
    transform(code, id) {
      if (process.env.VITE_COVERAGE !== "true" || !/[\\/]src[\\/].+\.(?:js|jsx)$/.test(id)) {
        return null;
      }

      const instrumenter = createInstrumenter({ esModules: true, produceSourceMap: true });
      const instrumentedCode = instrumenter.instrumentSync(code, id, this.getCombinedSourcemap());

      return { code: instrumentedCode, map: instrumenter.lastSourceMap() };
    },
  };
}

export default defineConfig({
  define:
    process.env.VITE_COVERAGE === "true"
      ? { "import.meta.env.VITE_API_URL": JSON.stringify("/api") }
      : {},
  plugins: [react(), coverageInstrumentation()],
});
