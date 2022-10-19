import { component$ } from "@builder.io/qwik";

export const Hero = component$(() => {
  return (
    <article>
      <section class="title">
        <div class="title-container">
          <div class="hero">
            <img
              src="images/qwiktober_hero.svg"
              class="hero-img"
              alt="Hero Image"
              width={500}
              height={707}
            />
          </div>

          <div class="big-heading">
            <h1>Qwiktober 2022</h1>
            <p style="color: white">
              HACKTOBERFEST IS FOR EVERYONE. WHETHER IT'S YOUR FIRST TIME—OR
              YOUR NINTH—IT'S ALMOST TIME TO HACK OUT FOUR PRISTINE PULL/MERGE
              REQUESTS AND COMPLETE YOUR MISSION FOR OPEN SOURCE.
            </p>
            <a href="/">
              <button class="explore-button">Explore</button>
            </a>
          </div>
        </div>
      </section>
    </article>
  );
});
