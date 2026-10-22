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
import { PdfEditorClient } from "@/components/tools/PdfEditorClient";
import { ImageCropperClient } from "@/components/tools/ImageCropperClient";

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
    // --- Existing Utilities ---
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
    case "pdf-editor":
      ToolComponent = <PdfEditorClient />;
      break;

    // --- Image Cropping Tools ---
    case "crop-image":
      ToolComponent = (
        <ImageCropperClient
          toolTitle="Crop Image"
          toolSubtitle="Crop and trim any image with freeform or standard aspect ratios."
        />
      );
      break;
    case "crop-png":
      ToolComponent = (
        <ImageCropperClient
          defaultFormat="image/png"
          lockFormat={true}
          allowedAccept="image/png,.png"
          toolTitle="Crop PNG Image"
          toolSubtitle="Crop transparent PNG images while preserving full alpha transparency."
        />
      );
      break;
    case "crop-webp":
      ToolComponent = (
        <ImageCropperClient
          defaultFormat="image/webp"
          lockFormat={true}
          allowedAccept="image/webp,.webp"
          toolTitle="Crop WebP Image"
          toolSubtitle="Crop WebP files with precision and export to high-compression WebP format."
        />
      );
      break;
    case "crop-jpg":
      ToolComponent = (
        <ImageCropperClient
          defaultFormat="image/jpeg"
          lockFormat={true}
          allowedAccept="image/jpeg,.jpg,.jpeg"
          toolTitle="Crop JPG Image"
          toolSubtitle="Crop JPG photos with precision aspect ratio controls and quality slider."
        />
      );
      break;

    // --- Image Converters ---
    case "svg-converter":
      ToolComponent = (
        <ImageConverterClient
          initialTargetFormat="image/png"
          toolTitle="SVG Converter"
          toolSubtitle="Convert SVG vectors to high-resolution PNG, JPG, WebP or vectorize photos into SVG."
          allowedAccept="image/svg+xml,.svg,image/png,image/jpeg,image/webp"
        />
      );
      break;
    case "png-converter":
      ToolComponent = (
        <ImageConverterClient
          initialTargetFormat="image/jpeg"
          toolTitle="PNG Converter"
          toolSubtitle="Convert PNG images to JPG, WebP, SVG, or GIF format instantly."
          allowedAccept="image/png,.png"
        />
      );
      break;
    case "jpg-converter":
      ToolComponent = (
        <ImageConverterClient
          initialTargetFormat="image/png"
          toolTitle="JPG Converter"
          toolSubtitle="Convert JPG / JPEG photos to transparent PNG, WebP or SVG format."
          allowedAccept="image/jpeg,.jpg,.jpeg"
        />
      );
      break;
    case "gif-converter":
      ToolComponent = (
        <ImageConverterClient
          initialTargetFormat="image/png"
          toolTitle="GIF Converter"
          toolSubtitle="Convert GIF animations and images into high-quality PNG, JPG or WebP."
          allowedAccept="image/gif,.gif,image/png,image/jpeg,image/webp"
        />
      );
      break;
    case "heic-to-jpg":
      ToolComponent = (
        <ImageConverterClient
          mode="heic"
          initialTargetFormat="image/jpeg"
          lockTargetFormat={true}
          toolTitle="HEIC to JPG Converter"
          toolSubtitle="Convert Apple iPhone HEIC and HEIF photos to universal high-quality JPG."
          allowedAccept="image/heic,image/heif,.heic,.heif"
        />
      );
      break;
    case "webp-to-png":
      ToolComponent = (
        <ImageConverterClient
          initialTargetFormat="image/png"
          lockTargetFormat={true}
          toolTitle="WebP to PNG Converter"
          toolSubtitle="Convert WebP images to lossless PNG format preserving transparency."
          allowedAccept="image/webp,.webp"
        />
      );
      break;
    case "webp-to-jpg":
      ToolComponent = (
        <ImageConverterClient
          initialTargetFormat="image/jpeg"
          lockTargetFormat={true}
          toolTitle="WebP to JPG Converter"
          toolSubtitle="Convert WebP images to high-compatibility JPG format with white background."
          allowedAccept="image/webp,.webp"
        />
      );
      break;
    case "png-to-jpg":
      ToolComponent = (
        <ImageConverterClient
          initialTargetFormat="image/jpeg"
          lockTargetFormat={true}
          toolTitle="PNG to JPG Converter"
          toolSubtitle="Convert transparent PNG images to universal JPG format with clean background."
          allowedAccept="image/png,.png"
        />
      );
      break;
    case "png-to-svg":
      ToolComponent = (
        <ImageConverterClient
          mode="png-to-svg"
          initialTargetFormat="image/svg+xml"
          lockTargetFormat={true}
          toolTitle="PNG to SVG Vectorizer"
          toolSubtitle="Vectorize raster PNG images into scalable vector SVG graphics."
          allowedAccept="image/png,.png,image/jpeg,.jpg"
        />
      );
      break;

    // --- Specialized Compressors ---
    case "compress-jpeg":
      ToolComponent = (
        <ImageCompressorClient
          initialFormat="image/jpeg"
          targetFormatLock="image/jpeg"
          defaultQuality={70}
          toolTitle="Compress JPEG"
          toolSubtitle="Reduce JPG and JPEG file size without visible loss in image quality."
          allowedAccept="image/jpeg,.jpg,.jpeg"
        />
      );
      break;
    case "png-compressor":
      ToolComponent = (
        <ImageCompressorClient
          initialFormat="image/png"
          targetFormatLock="image/png"
          toolTitle="PNG Compressor"
          toolSubtitle="Compress PNG images up to 70% with palette quantization and lossless compression."
          allowedAccept="image/png,.png"
        />
      );
      break;
    case "gif-compressor":
      ToolComponent = (
        <ImageCompressorClient
          initialFormat="image/webp"
          defaultQuality={65}
          toolTitle="GIF Compressor"
          toolSubtitle="Optimize and reduce GIF image file size for fast web loading."
          allowedAccept="image/gif,.gif,image/png,image/jpeg,image/webp"
        />
      );
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
