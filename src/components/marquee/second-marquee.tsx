import { component$ } from "@builder.io/qwik";

export const SecondMarquee = component$(() => {
  return (
    <marquee
      width="100%"
      direction="left"
      class="blink"
      scrollamount="25"
      behavior="scroll"
    >
      <h2>
        GET IN THE REPO, HACKER! • GET IN THE REPO, HACKER! • GET IN THE REPO,
        HACKER! • GET IN THE REPO, HACKER! • GET IN THE REPO, HACKER! • GET IN
        THE REPO, HACKER! • GET IN THE REPO, HACKER! • GET IN THE REPO, HACKER!
        • GET IN THE REPO, HACKER! • GET IN THE REPO, HACKER! • GET IN THE REPO,
        HACKER! • GET IN THE REPO, HACKER! • GET IN THE REPO, HACKER! • GET IN
        THE REPO, HACKER! • GET IN THE REPO, HACKER! • GET IN THE REPO, HACKER!
        • GET IN THE REPO, HACKER! • GET IN THE REPO, HACKER! • GET IN THE REPO,
        HACKER! • GET IN THE REPO, HACKER! • GET IN THE REPO, HACKER! • GET IN
        THE REPO, HACKER! • GET IN THE REPO, HACKER! • GET IN THE REPO, HACKER!
        •
      </h2>
    </marquee>
  );
});
