type UserAvatarProps = {
  seed: string;
  size?: number;
  style?: string;
};

export default function UserAvatar({
  seed,
  size = 40,
  style = "identicon",
}: UserAvatarProps) {
  const avatarUrl =
    `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(
      seed
    )}&size=${size}`;

  return (
    <img
      src={avatarUrl}
      alt="User avatar"
      width={size}
      height={size}
      className="rounded-full"
    />
  );
}