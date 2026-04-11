import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "..");

describe("scaffold", () => {
  it("package.json has required scripts", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    expect(pkg.scripts.dev).toBe("vite");
    expect(pkg.scripts.build).toBe("vite build");
    expect(pkg.scripts.test).toBe("vitest run");
    expect(pkg.scripts.lint).toContain("eslint");
  });

  it("package.json has required dependencies", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    expect(pkg.dependencies.react).toBeTruthy();
    expect(pkg.dependencies["react-dom"]).toBeTruthy();
    expect(pkg.dependencies.recharts).toBeTruthy();
  });

  it("index.html references /src/main.jsx", () => {
    const html = readFileSync(resolve(root, "index.html"), "utf8");
    expect(html).toContain("/src/main.jsx");
    expect(html).toContain('<div id="root">');
  });

  it("vite.config.js exists", () => {
    const cfg = readFileSync(resolve(root, "vite.config.js"), "utf8");
    expect(cfg).toContain("defineConfig");
    expect(cfg).toContain("react");
  });
});
