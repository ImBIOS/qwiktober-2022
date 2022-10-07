import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { CardGroup } from "~/components/card-group/card-group";
import { FirstMarquee } from "~/components/marquee/first-marquee";
import { SecondMarquee } from "~/components/marquee/second-marquee";
import { Hero } from "~/components/section/hero";
import contributor from "~/data/contributor";

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
            <CardGroup data={contributor} />
          </div>
        </section>
      </article>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Qwiktober 2022yy"
};
