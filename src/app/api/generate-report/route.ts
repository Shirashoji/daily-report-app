import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import {
  WorkTime,
  replaceTemplateVariables,
  generateWorkTimeText,
  createPrompt,
} from "./helpers";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function generateReportFromCommits(
  commits: string,
  modelName: string = "gemini-pro",
  reportType: string,
  workTimes: WorkTime[],
  startDateStr: string,
  endDateStr: string,
  customVariables: Record<string, string> = {},
  lastMeetingContent?: string,
): Promise<string> {
  const templateFileName =
    reportType === "meeting" ? "meeting-template.md" : "daily-template.md";
  const templatePath = path.join(process.cwd(), "public", templateFileName);
  let template = fs.readFileSync(templatePath, "utf-8");

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  template = replaceTemplateVariables(template, startDate, endDate, customVariables);
  const workTimeText = generateWorkTimeText(workTimes, reportType, startDate, endDate);
  const prompt = createPrompt(
    reportType,
    template,
    workTimeText,
    commits,
    lastMeetingContent,
  );

  const result = await genAI.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  const text = result.text;
  return text ?? "";
}

export async function POST(request: Request) {
  const {
    commits,
    model,
    reportType,
    workTimes,
    startDate,
    endDate,
    customVariables,
    lastMeetingContent,
  } = await request.json();

  try {
    const report = await generateReportFromCommits(
      commits,
      model,
      reportType,
      workTimes,
      startDate,
      endDate,
      customVariables,
      lastMeetingContent,
    );
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