/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginMenu } from "@/components/layout/login-menu";

describe("LoginMenu", () => {
  it("renders a direct sign-in link", () => {
    render(<LoginMenu />);

    const loginLink = screen.getByRole("link", { name: "Log In" });

    expect(loginLink).toHaveAttribute("href", "/auth/sign-in");
  });
});
