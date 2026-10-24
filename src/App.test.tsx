import { afterEach, beforeEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "./App";
import { createMockComma, type MockComma } from "./comma/mock";
import { MemoryRouter } from "./router";

let mock: MockComma;

beforeEach(() => {
  mock = createMockComma({
    viewer: { id: "v1", name: "Ada", avatarUrl: null, guest: false },
  });
  Object.defineProperty(globalThis, "comma", { value: mock, configurable: true });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(globalThis, "comma");
});

test("adds a note to the viewer's store", async () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  expect(await screen.findByText("Ada's notes")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("New note"), {
    target: { value: "Buy milk" },
  });
  fireEvent.click(screen.getByText("Add"));
  expect(await screen.findByText("Buy milk")).toBeTruthy();
  expect(mock.mock.stores.user.get("notes")?.value).toEqual([
    expect.objectContaining({ text: "Buy milk" }),
  ]);
});
