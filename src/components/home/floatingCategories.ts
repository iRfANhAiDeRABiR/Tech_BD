import type { StoreCategory } from "@/types/product";

export interface FloatingCategoryCard {
  id: string;
  name: string;
  badge: string;
  image: string;
  accent: string;
  column: "left" | "right";
}

interface FloatingCategoryConfig extends FloatingCategoryCard {
  matches: string[];
}

const floatingCategoryConfig: FloatingCategoryConfig[] = [
  {
    id: "windows",
    name: "Windows",
    badge: "OS & Systems",
    image: "/img_content/win11pro.png",
    accent: "#0078D4",
    matches: ["windows", "windows os", "windows license"],
    column: "left",
  },
  {
    id: "office",
    name: "Microsoft Office",
    badge: "Office Suite",
    image: "/img_content/office24proplus.png",
    accent: "#D83B01",
    matches: ["office", "microsoft office"],
    column: "right",
  },
  {
    id: "productivity",
    name: "Productivity",
    badge: "Cloud & 365",
    image: "/img_content/O365log.png",
    accent: "#7B5EA7",
    matches: ["productivity", "365", "microsoft 365", "office 365"],
    column: "left",
  },
  {
    id: "adobe",
    name: "Adobe",
    badge: "Creative Cloud",
    image: "/img_content/acc.png",
    accent: "#E31B23",
    matches: ["adobe", "adobe creative cloud"],
    column: "right",
  },
  {
    id: "cloud-storage",
    name: "Cloud Storage",
    badge: "Secure Backup",
    image: "/img_content/cds.png",
    accent: "#00BCF2",
    matches: ["cloud", "cloud storage", "cloud-storage"],
    column: "left",
  },
  {
    id: "vpn",
    name: "VPN",
    badge: "Privacy & Security",
    image: "/img_content/nordvpn.png",
    accent: "#00D4AA",
    matches: ["vpn"],
    column: "right",
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
      const categoryKeys = [category.slug, category.name].map(
        normalizeCategoryKey,
      );

      return config.matches.some((match) =>
        categoryKeys.includes(normalizeCategoryKey(match)),
      );
    });

    return {
      id: config.id,
      name: config.name,
      badge: config.badge,
      image: matchedCategory?.image || config.image,
      accent: config.accent,
      column: config.column,
    };
  });
}
