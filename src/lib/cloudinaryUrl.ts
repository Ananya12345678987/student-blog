// Appends Cloudinary's on-the-fly optimization transformations to a
// Cloudinary-hosted image URL. Only touches URLs that are actually from
// our Cloudinary account — a pasted URL from elsewhere passes through
// unchanged, since we can't apply Cloudinary transforms to images we
// don't host there.
export function optimizedImageUrl(
  url: string | undefined | null,
  opts: { width?: number; height?: number; crop?: "fill" | "fit" } = {}
): string | undefined {
  if (!url) return undefined;
  if (!url.includes("res.cloudinary.com")) return url;

  const { width, height, crop = "fill" } = opts;

  const transformParts = ["f_auto", "q_auto"];
  if (width) transformParts.push(`w_${width}`);
  if (height) transformParts.push(`h_${height}`);
  if (width || height) {
    transformParts.push(`c_${crop}`);
    if (crop === "fill") transformParts.push("g_auto"); // smart content-aware cropping
  }

  return url.replace("/upload/", `/upload/${transformParts.join(",")}/`);
}