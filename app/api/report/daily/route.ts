import { NextResponse } from "next/server";
import { renderDailyReportStream } from "@/lib/report";
import { requireStaff } from "@/lib/staff";

/**
 * GET /api/report/daily?date=YYYY-MM-DD
 * Renvoie le PDF de la journée. Réservé au staff.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireStaff();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  try {
    const nodeStream = await renderDailyReportStream(date);
    // Node Readable → Web ReadableStream
    const webStream = nodeReadableToWeb(nodeStream);
    return new Response(webStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="aureakform-${date}.pdf"`,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur génération PDF" },
      { status: 500 }
    );
  }
}

function nodeReadableToWeb(
  stream: NodeJS.ReadableStream
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => {
        controller.enqueue(
          typeof chunk === "string"
            ? new TextEncoder().encode(chunk)
            : new Uint8Array(chunk as Buffer)
        );
      });
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });
}
