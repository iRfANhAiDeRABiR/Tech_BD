import { notFound } from "next/navigation";
import { Metadata } from "next";
import { TOOLS } from "@/data/tools";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { AgeCalculatorClient } from "@/components/tools/AgeCalculatorClient";
import { Base64EncoderClient } from "@/components/tools/Base64EncoderClient";
import { CaseConverterClient } from "@/components/tools/CaseConverterClient";
import { HashtagGeneratorClient } from "@/components/tools/HashtagGeneratorClient";
import { ImageBlurClient } from "@/components/tools/ImageBlurClient";
import { ImageCompressorClient } from "@/components/tools/ImageCompressorClient";
import { ImageConverterClient } from "@/components/tools/ImageConverterClient";
import { ImageResizerClient } from "@/components/tools/ImageResizerClient";
import { ImageToPdfClient } from "@/components/tools/ImageToPdfClient";
import { MemeGeneratorClient } from "@/components/tools/MemeGeneratorClient";
import { PasswordGeneratorClient } from "@/components/tools/PasswordGeneratorClient";
import { ProfitCalculatorClient } from "@/components/tools/ProfitCalculatorClient";
import { QrCodeGeneratorClient } from "@/components/tools/QrCodeGeneratorClient";
import { ThumbnailMakerClient } from "@/components/tools/ThumbnailMakerClient";
import { UrlEncoderDecoderClient } from "@/components/tools/UrlEncoderDecoderClient";
import { WatermarkClient } from "@/components/tools/WatermarkClient";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.id === slug);
  if (!tool) {
    return { title: "Tool Not Found | Tech BD" };
  }
  return {
    title: `${tool.name} - Free Online Tool | Tech BD`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.id === slug);

  if (!tool) {
    notFound();
  }

  let ToolComponent: React.ReactNode = null;

  switch (slug) {
    case "age-calculator":
      ToolComponent = <AgeCalculatorClient />;
      break;
    case "base64-encoder":
      ToolComponent = <Base64EncoderClient />;
      break;
    case "case-converter":
      ToolComponent = <CaseConverterClient />;
      break;
    case "hashtag-generator":
      ToolComponent = <HashtagGeneratorClient />;
      break;
    case "image-blur":
      ToolComponent = <ImageBlurClient />;
      break;
    case "image-compressor":
      ToolComponent = <ImageCompressorClient />;
      break;
    case "image-converter":
      ToolComponent = <ImageConverterClient />;
      break;
    case "image-resizer":
      ToolComponent = <ImageResizerClient />;
      break;
    case "image-to-pdf":
      ToolComponent = <ImageToPdfClient />;
      break;
    case "meme-generator":
      ToolComponent = <MemeGeneratorClient />;
      break;
    case "password-generator":
      ToolComponent = <PasswordGeneratorClient />;
      break;
    case "profit-calculator":
      ToolComponent = <ProfitCalculatorClient />;
      break;
    case "qr-code-generator":
      ToolComponent = <QrCodeGeneratorClient />;
      break;
    case "thumbnail-maker":
      ToolComponent = <ThumbnailMakerClient />;
      break;
    case "url-encoder-decoder":
      ToolComponent = <UrlEncoderDecoderClient />;
      break;
    case "watermark":
      ToolComponent = <WatermarkClient />;
      break;
    default:
      notFound();
  }

  return (
    <ToolPageLayout toolId={slug}>
      {ToolComponent}
    </ToolPageLayout>
  );
}
