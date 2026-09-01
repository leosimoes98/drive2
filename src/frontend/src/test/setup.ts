import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { createElement } from "react";
import type React from "react";
import { vi } from "vitest";

// Generated components use `data-ocid` attributes as their stable test hooks.
configure({ testIdAttribute: "data-ocid" });

// `Layout` renders `Link` from @tanstack/react-router, which requires a live
// router context. In component tests we render pages in isolation, so provide
// a `Link` that renders a plain anchor instead of wiring up a full router.
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  const Link = ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => createElement("a", { href: to, ...rest }, children);
  return { ...actual, Link };
});

// `@caffeineai/object-storage` ships ESM with extensionless relative imports
// (`./blob`) that Node's ESM resolver rejects under Vitest. The app's own
// `@/backend` module re-exports `ExternalBlob` from it, so the package must
// load for any page that imports `@/types`. The tests mock the data hooks, so
// the real storage client is never exercised; provide a minimal stand-in.
vi.mock("@caffeineai/object-storage", () => {
  const ExternalBlob = {
    fromURL(url: string) {
      return { url };
    },
  };
  class StorageClient {
    async putFile() {
      return { hash: "mock" };
    }
    async getDirectURL() {
      return "https://mock";
    }
  }
  return { ExternalBlob, StorageClient };
});

// jsdom does not implement matchMedia, which some Radix/UI primitives query.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom does not implement ResizeObserver, used by some layout primitives.
if (!window.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: ResizeObserverStub,
  });
}
