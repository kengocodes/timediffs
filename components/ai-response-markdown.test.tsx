import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiResponseMarkdown } from "./ai-response-markdown";

describe("AiResponseMarkdown", () => {
  it("renders bold markdown as <strong>", () => {
    render(<AiResponseMarkdown content={"This is **bold** text."} />);

    const boldText = screen.getByText("bold");
    expect(boldText.tagName).toBe("STRONG");
  });

  it("renders markdown list items", () => {
    render(
      <AiResponseMarkdown
        content={"- Tokyo\n- **London**\n- [NYC](https://example.com)"}
      />,
    );

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
    expect(screen.getByText("London").tagName).toBe("STRONG");
    const link = screen.getByRole("link", { name: "NYC" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders escaped markdown emphasis from model output", () => {
    render(<AiResponseMarkdown content={"This is \\*\\*bold\\*\\* text."} />);

    const boldText = screen.getByText("bold");
    expect(boldText.tagName).toBe("STRONG");
  });

  it("renders entity-encoded markdown emphasis", () => {
    render(<AiResponseMarkdown content={"This is &ast;&ast;bold&ast;&ast; text."} />);

    const boldText = screen.getByText("bold");
    expect(boldText.tagName).toBe("STRONG");
  });
});
