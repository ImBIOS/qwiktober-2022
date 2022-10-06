import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ProfileCard } from "~/components/card/profile-card";
import { FirstMarquee } from "~/components/marquee/first-marquee";
import { SecondMarquee } from "~/components/marquee/second-marquee";
import { Hero } from "~/components/section/hero";

export default component$(() => {
  return (
    <div>
      {/* Hero */}
      <Hero />

      {/* Collection */}
      <article>
        <section class="collection">
          <FirstMarquee />
          <SecondMarquee />
          <div class="collection-container">
            <ProfileCard
              fullname="Imamuzzaki Abu Salam"
              image=""
              githubUsername="ImBIOS"
              instagramUsername="imamdev_"
              linkedinUsername="imamuzzaki-abu-salam"
            />
          </div>
        </section>
      </article>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Qwiktober 2022yy",
};
