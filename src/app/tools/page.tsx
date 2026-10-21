import { Metadata } from "next";
import { ToolsHubClient } from "./ToolsHubClient";

export const metadata: Metadata = {
  title: "Free Online Tools & Utilities | Tech BD",
  description:
    "Explore our suite of 16+ free web utilities: image resizer, converter, compressor, PDF generator, password generator, QR codes, and developer calculators.",
};

export default function ToolsPage() {
  return <ToolsHubClient />;
}
