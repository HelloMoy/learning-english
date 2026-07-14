import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { NativeVideoPlayer } from "./native-video-player";

describe("NativeVideoPlayer", () => {
  test("WHEN rendered THEN it shows a <video controls> with the lesson source", () => {
    // Arrange
    const source = "/videos/" + faker.system.fileName();
    const title = faker.lorem.sentence();

    // Act
    render(
      <NativeVideoPlayer
        source={source}
        title={title}
      />,
    );

    // Assert
    const video = screen.getByTitle(title) as HTMLVideoElement;
    expect(video.tagName).toBe("VIDEO");
    expect(video).toHaveAttribute("controls");
    expect(video.querySelector("source")?.getAttribute("src")).toBe(source);
  });

  test("WHEN a poster is provided THEN the <video> element receives the poster attribute", () => {
    // Arrange
    const poster = faker.internet.url();

    // Act
    const { container } = render(
      <NativeVideoPlayer
        source="/videos/x.mp4"
        poster={poster}
        title="t"
      />,
    );

    // Assert
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("poster", poster);
  });

  test("WHEN no poster is provided THEN the <video> element has no poster attribute", () => {
    // Act
    const { container } = render(
      <NativeVideoPlayer
        source="/videos/x.mp4"
        title="t"
      />,
    );

    // Assert
    const video = container.querySelector("video");
    expect(video?.getAttribute("poster")).toBeNull();
  });
});
