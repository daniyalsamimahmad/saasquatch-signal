// Browser-API shims for Radix + cmdk under jsdom.
if (typeof window !== "undefined") {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
    window.ResizeObserver ?? ResizeObserverMock;

  window.HTMLElement.prototype.scrollIntoView =
    window.HTMLElement.prototype.scrollIntoView ?? (() => {});
  window.HTMLElement.prototype.hasPointerCapture =
    window.HTMLElement.prototype.hasPointerCapture ?? (() => false);
  window.HTMLElement.prototype.setPointerCapture =
    window.HTMLElement.prototype.setPointerCapture ?? (() => {});
  window.HTMLElement.prototype.releasePointerCapture =
    window.HTMLElement.prototype.releasePointerCapture ?? (() => {});
}
