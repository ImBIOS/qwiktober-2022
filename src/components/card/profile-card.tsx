import { component$ } from "@builder.io/qwik";
import { GithubLogo } from "../icons/github";
import { InstagramLogo } from "../icons/instagram";
import { LinkedinLogo } from "../icons/linkedin";

export interface ProfileCardProps {
  fullname: string;
  image?: string;
  githubUsername: string;
  instagramUsername?: string;
  linkedinUsername?: string;
}

/**
 * The ProfileCard component is reusable component that can be used to display a profile card.
 */
export const ProfileCard = component$(
  ({
    fullname,
    image,
    githubUsername,
    instagramUsername,
    linkedinUsername
  }: ProfileCardProps) => {
    return (
      <>
        <div class="biography-card" data-aos="fade-up" data-aos-duration="2000">
          <figure>
            <img
              loading="lazy"
              src={
                image
                  ? image
                  : `https://www.github.com/${githubUsername}.png?size=300`
              }
              height="300"
              width="300"
              alt="Profile"
              class="profile-img"
            />
          </figure>
          <h3>{fullname}</h3>
          <div class="contact">
            <a
              class="social-media"
              href={`https://www.github.com/${githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubLogo />
            </a>
            {instagramUsername && (
              <a
                class="social-media"
                href={`https://www.instagram.com/${instagramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramLogo />
              </a>
            )}
            {linkedinUsername && (
              <a
                class="social-media"
                href={`https://www.linkedin.com/in/${linkedinUsername}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedinLogo />
              </a>
            )}
          </div>
        </div>
      </>
    );
  }
);
