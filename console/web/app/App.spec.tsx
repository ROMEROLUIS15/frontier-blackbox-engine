import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App.tsx";

afterEach(cleanup);

describe("App shell", () => {
  it("renders the three tabs and the sandbox badge", () => {
    render(<App />);
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Consola", "Experimentos", "Arquitectura"]);
    expect(screen.getByText("SANDBOX · réplica real en proceso — sin servicio original")).toBeTruthy();
    expect(screen.getByText("github.com/ROMEROLUIS15/frontier-blackbox-engine")).toBeTruthy();
  });

  it("switches view on click", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Arquitectura" }));
    expect(screen.getByRole("tab", { name: "Arquitectura" }).getAttribute("aria-selected")).toBe("true");
    expect(await screen.findByText("Módulos de la réplica")).toBeTruthy();
  });

  it("switches view with the keyboard", async () => {
    render(<App />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Consola" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Experimentos" }).getAttribute("aria-selected")).toBe("true");
    expect(await screen.findByText("Registro de hipótesis contra el servicio original")).toBeTruthy();
  });
});
