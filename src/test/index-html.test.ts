/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const indexPath = resolve(process.cwd(), "index.html");

describe("index.html", () => {
  it("has project title and description for SEO", () => {
    const html = readFileSync(indexPath, "utf-8");

    expect(html).toContain("<title>Customer Feedback Previewer</title>");
    expect(html).toContain(
      'name="description" content="Submit feature requests and bug reports. Vote on ideas, comment on feedback, and preview in-progress changes."'
    );
  });

  it("has required structure for SPA", () => {
    const html = readFileSync(indexPath, "utf-8");

    expect(html).toContain('<div id="root">');
    expect(html).toContain('src="/src/main.tsx"');
    expect(html).toContain('lang="en"');
  });

  it("has favicon link", () => {
    const html = readFileSync(indexPath, "utf-8");

    expect(html).toContain('rel="icon" type="image/svg+xml" href="/favicon.svg"');
  });
});
