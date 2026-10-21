export interface SoftwareVersionLink {
  label: string;
  url: string;
  arch?: string;
}

export type SoftwareVersionOption = SoftwareVersionLink;

export type SoftwareDownloadVariant =
  | "office-2024"
  | "office-365"
  | "win-11"
  | "win-10"
  | "office-2021"
  | "office-multi"
  | "office-2016"
  | "office-2010"
  | "visio"
  | "project"
  | "custom";

export interface SoftwareDownloadItem {
  id: string;
  title: string;
  fullName: string;
  badgeLabel: string;
  variant: SoftwareDownloadVariant;
  category: string;
  version: string;
  architecture: string;
  fileSize: string;
  fileType: string;
  downloadUrl: string;
  productLink: string;
  image?: string | null;
  imagePublicId?: string | null;
  sortOrder: number;
  isActive: boolean;
  versions: SoftwareVersionLink[];
}

export const SOFTWARE_DOWNLOADS: SoftwareDownloadItem[] = [
  {
    id: "office-2024",
    title: "Office 2024",
    fullName: "Microsoft Office Professional Plus 2024",
    badgeLabel: "Office 2024",
    variant: "office-2024",
    category: "Office",
    version: "2024 Retail (English)",
    architecture: "64-Bit & 32-Bit",
    fileSize: "4.8 GB",
    fileType: "Official IMG / C2R",
    downloadUrl:
      "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProPlus2024Retail.img",
    productLink: "/products?search=Office+2024#products-by-category",
    image: null,
    sortOrder: 1,
    isActive: true,
    versions: [
      {
        label: "Office 2024 Pro Plus (Full Offline IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProPlus2024Retail.img",
        arch: "32/64-Bit",
      },
      {
        label: "Office 2024 Home & Business (Full Offline IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/HomeBusiness2024Retail.img",
        arch: "32/64-Bit",
      },
    ],
  },
  {
    id: "office-365",
    title: "Office 365",
    fullName: "Microsoft 365 Apps for Enterprise / Personal",
    badgeLabel: "Office 365",
    variant: "office-365",
    category: "Office",
    version: "Latest Cloud Build",
    architecture: "64-Bit & 32-Bit",
    fileSize: "4.5 GB",
    fileType: "Official Setup / IMG",
    downloadUrl:
      "https://c2rsetup.officeapps.live.com/c2r/download.aspx?productReleaseID=O365ProPlusRetail&platform=def&language=en-us&version=O16GA",
    productLink: "/products?search=365#products-by-category",
    image: null,
    sortOrder: 2,
    isActive: true,
    versions: [
      {
        label: "Office 365 Online Web Installer (Fastest)",
        url: "https://c2rsetup.officeapps.live.com/c2r/download.aspx?productReleaseID=O365ProPlusRetail&platform=def&language=en-us&version=O16GA",
        arch: "64-Bit",
      },
      {
        label: "Office 365 Full Offline Installer (IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/O365ProPlusRetail.img",
        arch: "32/64-Bit",
      },
    ],
  },
  {
    id: "windows-11-pro",
    title: "Windows 11 Pro",
    fullName: "Microsoft Windows 11 Professional (24H2)",
    badgeLabel: "Windows 11 Pro",
    variant: "win-11",
    category: "Windows",
    version: "24H2 Official Build",
    architecture: "64-Bit (x64)",
    fileSize: "5.4 GB",
    fileType: "Official ISO / Assistant",
    downloadUrl: "https://www.microsoft.com/en-us/software-download/windows11",
    productLink: "/products?search=Windows+11#products-by-category",
    image: null,
    sortOrder: 3,
    isActive: true,
    versions: [
      {
        label: "Windows 11 Official Download Page (ISO & Media Tool)",
        url: "https://www.microsoft.com/en-us/software-download/windows11",
        arch: "64-Bit",
      },
      {
        label: "Windows 11 Installation Assistant (Direct EXE)",
        url: "https://go.microsoft.com/fwlink/?linkid=2171764",
        arch: "64-Bit",
      },
      {
        label: "Windows 11 Media Creation Tool (Direct EXE)",
        url: "https://go.microsoft.com/fwlink/?linkid=2156295",
        arch: "64-Bit",
      },
    ],
  },
  {
    id: "windows-10-pro",
    title: "Windows 10 Pro",
    fullName: "Microsoft Windows 10 Professional (22H2)",
    badgeLabel: "Windows 10 Pro",
    variant: "win-10",
    category: "Windows",
    version: "22H2 Final Build",
    architecture: "64-Bit & 32-Bit",
    fileSize: "4.7 GB",
    fileType: "Official ISO / Media Tool",
    downloadUrl: "https://www.microsoft.com/en-us/software-download/windows10",
    productLink: "/products?search=Windows+10#products-by-category",
    image: null,
    sortOrder: 4,
    isActive: true,
    versions: [
      {
        label: "Windows 10 Official Download Page (ISO & Media Tool)",
        url: "https://www.microsoft.com/en-us/software-download/windows10",
        arch: "32/64-Bit",
      },
      {
        label: "Windows 10 Media Creation Tool (Direct EXE)",
        url: "https://go.microsoft.com/fwlink/?LinkId=2265055",
        arch: "32/64-Bit",
      },
    ],
  },
  {
    id: "office-2021",
    title: "Office 2021",
    fullName: "Microsoft Office Professional Plus 2021",
    badgeLabel: "Office 2021",
    variant: "office-2021",
    category: "Office",
    version: "2021 Retail",
    architecture: "64-Bit & 32-Bit",
    fileSize: "4.6 GB",
    fileType: "Official IMG",
    downloadUrl:
      "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProPlus2021Retail.img",
    productLink: "/products?search=Office+2021#products-by-category",
    image: null,
    sortOrder: 5,
    isActive: true,
    versions: [
      {
        label: "Office 2021 Pro Plus (Full Offline IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProPlus2021Retail.img",
        arch: "32/64-Bit",
      },
      {
        label: "Office 2021 Home & Business (Full Offline IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/HomeBusiness2021Retail.img",
        arch: "32/64-Bit",
      },
    ],
  },
  {
    id: "office-multi",
    title: "Office 2019",
    fullName: "Microsoft Office 2019 Pro Plus & Home & Business",
    badgeLabel: "Office 2019",
    variant: "office-multi",
    category: "Office",
    version: "2019 Retail",
    architecture: "64-Bit & 32-Bit",
    fileSize: "4.5 GB",
    fileType: "Official IMG",
    downloadUrl:
      "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProPlus2019Retail.img",
    productLink: "/products?search=Office+2019#products-by-category",
    image: null,
    sortOrder: 6,
    isActive: true,
    versions: [
      {
        label: "Office 2019 Pro Plus (Full Offline IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProPlus2019Retail.img",
        arch: "32/64-Bit",
      },
      {
        label: "Office 2019 Home & Business (Full Offline IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/HomeBusiness2019Retail.img",
        arch: "32/64-Bit",
      },
    ],
  },
  {
    id: "office-2016",
    title: "Office 2016",
    fullName: "Microsoft Office Professional Plus 2016",
    badgeLabel: "Office 2016",
    variant: "office-2016",
    category: "Office",
    version: "2016 Retail",
    architecture: "64-Bit & 32-Bit",
    fileSize: "4.1 GB",
    fileType: "Official IMG",
    downloadUrl:
      "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProPlusRetail.img",
    productLink: "/products?search=Office+2016#products-by-category",
    image: null,
    sortOrder: 7,
    isActive: true,
    versions: [
      {
        label: "Office 2016 Pro Plus (Full Offline IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProPlusRetail.img",
        arch: "32/64-Bit",
      },
      {
        label: "Office 2016 Home & Business (Full Offline IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/HomeBusinessRetail.img",
        arch: "32/64-Bit",
      },
    ],
  },
  {
    id: "office-2010",
    title: "Office 2010",
    fullName: "Microsoft Office Professional Plus 2010 SP2",
    badgeLabel: "Office 2010",
    variant: "office-2010",
    category: "Office",
    version: "2010 SP2",
    architecture: "64-Bit & 32-Bit",
    fileSize: "850 MB",
    fileType: "ISO Installer",
    downloadUrl:
      "https://archive.org/download/microsoft-office-2010-professional-plus-x64/SW_DVD5_Office_Professional_Plus_2010w_SP1_64Bit_English_CORE_MLF_X17-76756.ISO",
    productLink: "/products?search=Office#products-by-category",
    image: null,
    sortOrder: 8,
    isActive: true,
    versions: [
      {
        label: "Office 2010 Pro Plus (64-Bit ISO)",
        url: "https://archive.org/download/microsoft-office-2010-professional-plus-x64/SW_DVD5_Office_Professional_Plus_2010w_SP1_64Bit_English_CORE_MLF_X17-76756.ISO",
        arch: "64-Bit",
      },
      {
        label: "Office 2010 Pro Plus (32-Bit ISO)",
        url: "https://archive.org/download/microsoft-office-2010-professional-plus-x86/SW_DVD5_Office_Professional_Plus_2010w_SP1_W32_English_CORE_MLF_X17-76748.ISO",
        arch: "32-Bit",
      },
    ],
  },
  {
    id: "visio-pro",
    title: "Visio 2024/2021/2019/2016 Pro",
    fullName: "Microsoft Visio Professional Edition",
    badgeLabel: "Visio Pro",
    variant: "visio",
    category: "Project & Visio",
    version: "2024 / 2021 / 2019 / 2016",
    architecture: "64-Bit & 32-Bit",
    fileSize: "4.5 GB",
    fileType: "Official IMG",
    downloadUrl:
      "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/VisioPro2024Retail.img",
    productLink: "/products?search=Visio#products-by-category",
    image: null,
    sortOrder: 9,
    isActive: true,
    versions: [
      {
        label: "Visio Professional 2024 (Official IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/VisioPro2024Retail.img",
        arch: "32/64-Bit",
      },
      {
        label: "Visio Professional 2021 (Official IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/VisioPro2021Retail.img",
        arch: "32/64-Bit",
      },
      {
        label: "Visio Professional 2019 (Official IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/VisioPro2019Retail.img",
        arch: "32/64-Bit",
      },
      {
        label: "Visio Professional 2016 (Official IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/VisioProRetail.img",
        arch: "32/64-Bit",
      },
    ],
  },
  {
    id: "project-pro",
    title: "Project 2024/2021/2019/2016 Pro",
    fullName: "Microsoft Project Professional Edition",
    badgeLabel: "Project Pro",
    variant: "project",
    category: "Project & Visio",
    version: "2024 / 2021 / 2019 / 2016",
    architecture: "64-Bit & 32-Bit",
    fileSize: "4.5 GB",
    fileType: "Official IMG",
    downloadUrl:
      "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProjectPro2024Retail.img",
    productLink: "/products?search=Project#products-by-category",
    image: null,
    sortOrder: 10,
    isActive: true,
    versions: [
      {
        label: "Project Professional 2024 (Official IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProjectPro2024Retail.img",
        arch: "32/64-Bit",
      },
      {
        label: "Project Professional 2021 (Official IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProjectPro2021Retail.img",
        arch: "32/64-Bit",
      },
      {
        label: "Project Professional 2019 (Official IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProjectPro2019Retail.img",
        arch: "32/64-Bit",
      },
      {
        label: "Project Professional 2016 (Official IMG)",
        url: "https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProjectProRetail.img",
        arch: "32/64-Bit",
      },
    ],
  },
];

export interface SupportFaqItem {
  question: string;
  answer: string;
}

export const DOWNLOAD_FAQS: SupportFaqItem[] = [
  {
    question: "ডাউনলোড করা .IMG বা .ISO ফাইল কিভাবে ইনস্টল করব?",
    answer:
      "ফাইলটি ডাউনলোড হওয়ার পর সেটির উপর ডাবল-ক্লিক (Double Click) অথবা রাইট-ক্লিক করে 'Mount' অপশনে ক্লিক করুন। এরপর ভেতরে থাকা 'Setup.exe' ফাইলটি রান করলেই ইনস্টলেশন শুরু হয়ে যাবে।",
  },
  {
    question: "নতুন অফিস ইনস্টল করার আগে পুরাতন ভার্সন কি আনইনস্টল করতে হবে?",
    answer:
      "হ্যাঁ, কোনো প্রকার এরর ছাড়া সঠিকভাবে ইনস্টল ও এক্টিভ করার জন্য আপনার পিসিতে থাকা পূর্বের যেকোনো Office ভার্সন Control Panel থেকে Uninstall করে পিসি রিস্টার্ট নিয়ে নতুন ভার্সন ইনস্টল করার পরামর্শ দেওয়া হয়।",
  },
  {
    question: "Visio বা Project এর ক্ষেত্রে কোন ভার্সনটি ডাউনলোড করব?",
    answer:
      "ডাউনলোড বাটনে ক্লিক করলে আপনি 2024, 2021, 2019 এবং 2016—সবগুলো ভার্সনের আলাদা অফিশিয়াল লিঙ্ক দেখতে পাবেন। আপনি যে ভার্সনের লাইসেন্স কি (Key) কিনেছেন, সেটি সিলেক্ট করে ডাউনলোড করুন।",
  },
  {
    question: "ইনস্টল বা এক্টিভেশন করতে সমস্যা হলে কিভাবে সাপোর্ট পাব?",
    answer:
      "আমাদের পেজের নিচে বা হেডারে থাকা WhatsApp অথবা Telegram বাটনে ক্লিক করে সরাসরি মেসেজ দিন। আমাদের টেকনিক্যাল সাপোর্ট টিম AnyDesk/TeamViewer-এর মাধ্যমে ফ্রি ইনস্টলেশন ও এক্টিভেশন সাপোর্ট প্রদান করবে।",
  },
];
