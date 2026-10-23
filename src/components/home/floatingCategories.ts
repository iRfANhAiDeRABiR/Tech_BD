import type { StoreCategory } from "@/types/product";

export interface FloatingCategoryCard {
  name: string;
  image: string;
}

interface FloatingCategoryConfig extends FloatingCategoryCard {
  matches: string[];
}

const floatingCategoryConfig: FloatingCategoryConfig[] = [
  {
    name: "Windows",
    image: "/img_content/win11pro.png",
    matches: ["windows", "windows os", "windows license"],
  },
  {
    name: "Microsoft Office",
    image: "/img_content/office24proplus.png",
    matches: ["office", "microsoft office"],
  },
  {
    name: "Cloud Storage",
    image: "/img_content/cds.png",
    matches: ["cloud", "cloud storage", "cloud-storage"],
  },
  {
    name: "VPN",
    image: "/img_content/nordvpn.png",
    matches: ["vpn"],
  },
  {
    name: "Creativity & Design",
    image: "/img_content/adobe.png",
    matches: [
      "creativity-&-design",
      "creativity & design",
      "creativity and design",
      "creativity",
      "design",
      "adobe",
      "adobe creative cloud",
    ],
  },
  {
    name: "Productivity",
    image: "/img_content/O365log.png",
    matches: ["productivity", "365", "microsoft 365", "office 365"],
  },
];

const normalizeCategoryKey = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function getFloatingCategoryCards(
  categories: StoreCategory[] = [],
): FloatingCategoryCard[] {
  return floatingCategoryConfig.map((config) => {
    const matchedCategory = categories.find((category) => {
      const categoryKeys = [category.slug, category.name].map(normalizeCategoryKey);

      return config.matches.some((match) =>
        categoryKeys.includes(normalizeCategoryKey(match)),
      );
    });

    const categoryImage =
      matchedCategory?.image && matchedCategory.image !== "/img_content/acc.png"
        ? matchedCategory.image
        : config.image;

    return {
      name: config.name,
      image: categoryImage,
    };
  });
}
