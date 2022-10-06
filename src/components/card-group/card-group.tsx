import { component$ } from "@builder.io/qwik";
import type { ProfileCardProps } from "../card/profile-card";
import { ProfileCard } from "../card/profile-card";

interface CardGroupProps {
  data: ProfileCardProps[];
}

/**
 * The CardGroup component is component that can be used to display a group profile card.
 */
export const CardGroup = component$(({ data }: CardGroupProps) => {
  return (
    <>
      {data.map((item) => (
        <ProfileCard
          fullname={item.fullname}
          image={item.image}
          githubUsername={item.githubUsername}
          instagramUsername={item.instagramUsername}
          linkedinUsername={item.linkedinUsername}
        />
      ))}
    </>
  );
});
