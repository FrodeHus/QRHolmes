import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeScreen from "./HomeScreen";

function renderHome() {
  render(<HomeScreen onInspect={() => {}} onPrivacy={() => {}} />);
}

function setUserAgent(userAgent: string) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
}

describe("HomeScreen install prompt", () => {
  beforeEach(() => {
    setUserAgent("Mozilla/5.0 jsdom");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    vi.stubGlobal("open", vi.fn());
  });

  it("shows the native install action when beforeinstallprompt fires", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const installEvent = new Event("beforeinstallprompt") as Event & {
      prompt: typeof prompt;
      userChoice: Promise<{ outcome: "accepted"; platform: string }>;
    };
    installEvent.prompt = prompt;
    installEvent.userChoice = Promise.resolve({
      outcome: "accepted",
      platform: "web",
    });
    installEvent.preventDefault = vi.fn();

    renderHome();
    window.dispatchEvent(installEvent);

    await userEvent.click(
      await screen.findByRole("button", { name: "Install" }),
    );

    expect(installEvent.preventDefault).toHaveBeenCalled();
    expect(prompt).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByLabelText("Install QRHolmes")).not.toBeInTheDocument();
    });
  });

  it("shows iPhone install guidance even when native install prompt is unavailable", async () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    );

    renderHome();

    expect(
      await screen.findByRole("heading", { name: "Add to Home Screen" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Use Safari Share/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "How" }));

    expect(
      await screen.findByText(/Tap Share, then Add to Home Screen/i),
    ).toBeInTheDocument();
  });

  it("does not show install guidance when already running standalone", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });

    renderHome();

    expect(screen.queryByLabelText("Install QRHolmes")).not.toBeInTheDocument();
  });
});
