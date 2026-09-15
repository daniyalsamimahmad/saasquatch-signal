// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { IndustryPicker } from "@/components/find/industry-picker";

/**
 * F-02 regression suite. Their combobox: never closes on Escape, never
 * closes on outside click, no keyboard navigation, covers the submit button.
 * Every behaviour below is one of those failures, fixed.
 */

afterEach(cleanup);

function setup() {
  const onSelect = vi.fn();
  const utils = render(
    <div>
      <IndustryPicker value={null} onSelect={onSelect} />
      <button type="button">Find companies</button>
    </div>,
  );
  return { onSelect, ...utils };
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox"));
  return screen.findByPlaceholderText("Type an industry — typos welcome");
}

describe("IndustryPicker (F-02 fix)", () => {
  it("opens on click and lists canonical industries grouped with NAICS codes", async () => {
    const user = userEvent.setup();
    setup();
    await openPicker(user);
    expect(await screen.findByText("Healthcare Software")).toBeTruthy();
    expect(screen.getAllByText("541511").length).toBeGreaterThan(0);
  });

  it("closes on Escape — their dropdown does not", async () => {
    const user = userEvent.setup();
    setup();
    const input = await openPicker(user);
    expect(screen.queryByText("Healthcare Software")).toBeTruthy();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Healthcare Software")).toBeNull();
  });

  it("closes on outside click — their dropdown does not", async () => {
    const user = userEvent.setup();
    setup();
    await openPicker(user);
    expect(screen.queryByText("Healthcare Software")).toBeTruthy();
    fireEvent.pointerDown(document.body);
    fireEvent.pointerUp(document.body);
    fireEvent.click(document.body);
    expect(screen.queryByText("Healthcare Software")).toBeNull();
  });

  it("supports full keyboard selection: type → ArrowDown → Enter", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();
    const input = await openPicker(user);
    await user.type(input, "healthcare");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].id).toContain("healthcare");
    // selection also closes the popover
    expect(screen.queryByPlaceholderText("Type an industry — typos welcome")).toBeNull();
  });

  it("resolves free-text typos the list filter can't surface", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();
    const input = await openPicker(user);
    await user.type(input, "computr software");
    const suggestion = await screen.findByRole("button", {
      name: /Software Development/,
    });
    await user.click(suggestion);
    expect(onSelect).toHaveBeenCalledTimes(1);
    const [industry, resolution] = onSelect.mock.calls[0];
    expect(industry.id).toBe("software-development");
    expect(resolution.corrections).toContain("computr → computer");
  });
});
