import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge.tsx";

describe("StatusBadge", () => {
  it.each([
    [201, "success"],
    [404, "warning"],
    [500, "danger"],
  ])("maps %i to the %s tone and shows the code", (status, tone) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByText(String(status));
    expect(badge.getAttribute("data-tone")).toBe(tone);
  });
});
