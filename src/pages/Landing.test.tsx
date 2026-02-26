import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithQueryClient } from "@/test/utils";

import { Landing } from "./Landing";

describe("Landing", () => {
  it("renders the chat prompt heading", () => {
    renderWithQueryClient(<Landing />);

    expect(
      screen.getByRole("heading", { name: /how can i help/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/describe your feature request or bug report/i)
    ).toBeInTheDocument();
  });

  it("renders the generate draft button", () => {
    renderWithQueryClient(<Landing />);

    expect(
      screen.getByRole("button", { name: /generate draft/i })
    ).toBeInTheDocument();
  });

  it("accepts input and submits on button click", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Landing />);

    const input = screen.getByPlaceholderText(/describe your feature request or bug report/i);
    const sendButton = screen.getByRole("button", { name: /generate draft/i });

    await user.type(input, "Hello");
    expect(input).toHaveValue("Hello");

    await user.click(sendButton);
    // Submit starts loading; button shows "Generating..." state
    expect(sendButton).toHaveAttribute("aria-label", "Generating...");
  });
});
