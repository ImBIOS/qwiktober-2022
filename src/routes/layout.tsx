import { component$, Slot } from "@builder.io/qwik";
import Header from "../components/header/header";

export default component$(() => {
  return (
    <>
      <Header />
      <main>
        <div id="content">
          <Slot />
        </div>
      </main>
      <footer>
        <p>Qwiktober &copy; 2022.</p>
      </footer>
    </>
  );
});
