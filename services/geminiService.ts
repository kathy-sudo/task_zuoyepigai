import { GoogleGenAI, Type } from "@google/genai";
import { GradingResult, SubmissionContent } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const gradeHomework = async (submission: SubmissionContent): Promise<GradingResult> => {
  if (!submission.data) {
    throw new Error("Invalid submission data provided.");
  }

  const modelId = "gemini-2.5-flash"; // Using Flash for fast multimodal processing
  
  const systemInstruction = `
    You are an expert academic grader and teaching assistant known for precision, fairness, and constructive feedback.
    
    Your Task:
    Analyze the student's homework assignment provided.
    Assign a score (0-100) and provide a brief, actionable comment.

    Grading Criteria (Standardized):
    1. Understanding (40%): Does the student demonstrate a clear grasp of the core concepts?
    2. Logic & Structure (30%): Is the argument or solution presented logically and coherently?
    3. Completeness (30%): Did the student answer all parts of the question?

    Output Requirement:
    Return the result strictly in JSON format.
    The 'score' must be the weighted average of the three criteria.
    Include a 'breakdown' object with individual scores (0-100) for 'understanding', 'logic', and 'completeness'.
  `;

  // Prepare contents based on input type
  const parts = [];
  
  if (submission.type === 'file') {
    // For PDFs and Images
    parts.push({
      inlineData: {
        mimeType: submission.mimeType,
        data: submission.data
      }
    });
    parts.push({ text: "Please grade this homework assignment based on the provided file." });
  } else {
    // For extracted text (DOCX, TXT, MD)
    parts.push({ text: "Here is the content of the homework assignment:" });
    parts.push({ text: submission.data });
    parts.push({ text: "Please grade this content." });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Final weighted score (0-100)" },
            summary: { type: Type.STRING, description: "A 1-2 sentence summary of performance" },
            feedback: { type: Type.STRING, description: "Constructive criticism and praise (30-50 words)" },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                understanding: { type: Type.NUMBER, description: "Score for Understanding (0-100)" },
                logic: { type: Type.NUMBER, description: "Score for Logic & Structure (0-100)" },
                completeness: { type: Type.NUMBER, description: "Score for Completeness (0-100)" },
              },
              required: ["understanding", "logic", "completeness"],
            },
          },
          required: ["score", "summary", "feedback", "breakdown"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const data = JSON.parse(text) as GradingResult;
    return data;
  } catch (error) {
    console.error("Gemini Grading Error:", error);
    throw error;
  }
};