import { component$, useServerMount$, useStore } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { CardGroup } from "~/components/card-group/card-group";
import { FirstMarquee } from "~/components/marquee/first-marquee";
import { SecondMarquee } from "~/components/marquee/second-marquee";
import { Hero } from "~/components/section/hero";
import contributors from "~/data/contributors";

export default component$(() => {
  const store = useStore({ data: [] });

  useServerMount$(async () => {
    const response = await fetch(
      "https://api.github.com/repos/ImBIOS/qwiktober-2022/contributors"
    );
    let data = await response.json();

    data = data.map((contributor: Contributor) => {
      return {
        githubUsername: contributor.login,
        fullname: contributor.login,
        image: contributor.avatar_url
      };
    });

    store.data = data;
  });

  const combinedData = contributors.concat(store.data);

  const confirmedContributors = combinedData.filter(
    (elem, index, arr) =>
      arr.findIndex((e) => e.githubUsername === elem.githubUsername) === index
  );

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
            <CardGroup data={confirmedContributors} />
          </div>
        </section>
      </article>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Qwiktober 2022"
};

interface Contributor {
  login: string;
  avatar_url: string;
}
