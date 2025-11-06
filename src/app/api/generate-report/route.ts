import { NextResponse } from "next/server";



import { generateReportFlow } from "../../genkit";

export async function POST(request: Request) {
  const {
    commits,
    model,
    reportType,
    workTimes,
    targetDate,
    customVariables,
    lastMeetingContent,
  } = await request.json();

  try {
    const report = await generateReportFlow.run({
      commits,
      modelName: model,
      reportType,
      workTimes,
      targetDateStr: targetDate,
      customVariables,
      lastMeetingContent,
    });
    return NextResponse.json({ report });
  } catch (error) {
    console.error(error);
    if (
      error instanceof Error &&
      error.message.includes("is not found for API version")
    ) {
      return NextResponse.json(
        {
          error: `選択されたモデル'${model}'が見つかりません。別のモデルを試してください。`,
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
