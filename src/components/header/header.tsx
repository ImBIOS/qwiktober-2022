import { $, component$ } from "@builder.io/qwik";
import { MenuIcon } from "../icons/menu";

export default component$(() => {
  const toggleMenu = $(() => {
    const navbarItem = document.getElementsByClassName("navbar-item");
    for (let i = 0; i < navbarItem.length; i++) {
      navbarItem[i].classList.toggle("show");
    }
  });

  return (
    <header>
      <nav>
        <ul class="navbar-list">
          <li class="logo">
            <a href="#">Qwiktober 2022</a>
          </li>
          <li class="toggle" onClick$={toggleMenu}>
            <MenuIcon />
          </li>
          <li class="navbar-item">
            <a href="/" class="navbar-link">
              Explore
            </a>
          </li>
          <li class="navbar-item">
            <a href="/" class="navbar-link">
              Resources
            </a>
          </li>
          {/* <li class="navbar-item">
            <a href="#" class="navbar-button">
              Login
            </a>
          </li>
          <li class="navbar-item">
            <a href="#" class="navbar-button">
              Sign Up
            </a>
          </li> */}
        </ul>
      </nav>
    </header>
  );
});
