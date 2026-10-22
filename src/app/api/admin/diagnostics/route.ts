import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSystemTelemetry } from "@/lib/diagnostics";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const telemetry = await getSystemTelemetry();
    return NextResponse.json(telemetry, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Failed to retrieve diagnostics telemetry:", err);
    return NextResponse.json(
      { error: "Failed to gather telemetry" },
      { status: 500 }
    );
  }
}

