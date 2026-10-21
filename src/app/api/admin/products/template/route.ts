import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const sampleCsv = `\uFEFFid,slug,name,category,price,originalPrice,badge,status,isFeatured,outOfStock,sortOrder,image,shortDescription,descriptionHtml,options
win-11-pro,windows-11-pro,Windows 11 Professional,Operating Systems,1500,2500,Best Seller,ACTIVE,true,false,1,https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=500,Lifetime license key for Windows 11 Pro,"<p>Genuine digital retail license key for 1 PC. Lifetime activation and official updates.</p>","[{""name"":""1 PC Retail Key"",""price"":1500,""type"":""RETAIL_KEY""},{""name"":""Bind Key (Linked to MS Account)"",""price"":2200,""type"":""BIND_KEY""}]"
office-2021-pro,office-2021-pro-plus,Microsoft Office 2021 Pro Plus,Office Software,1800,3000,Hot Deal,ACTIVE,true,false,2,https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500,Word Excel PowerPoint Outlook Access Publisher,"<p>Lifetime Office 2021 Professional Plus license with all apps included.</p>","[{""name"":""1 PC License"",""price"":1800,""type"":""RETAIL_KEY""}]"
`;

  return new NextResponse(sampleCsv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="product-import-template.csv"',
    },
  });
}

