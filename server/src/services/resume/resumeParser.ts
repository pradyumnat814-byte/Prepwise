import fs from "fs";
// Import pdf-parse core library
// @ts-ignore
import pdfParseModule from "pdf-parse/lib/pdf-parse.js";

// Handle Bun CommonJS/ESM import resolution cleanly
const pdfParse = typeof pdfParseModule === "function" 
  ? pdfParseModule 
  : pdfParseModule.default;

export interface IParsedResume {
  rawText: string;
  extractedSkills: string[];
  educationKeywords: string[];
  projectKeywords: string[];
}

const SKILL_DICTIONARY = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "Rust", "PHP", "Ruby",
  "React", "Next.js", "Vue", "Angular", "Node.js", "Express", "NestJS", "Django", "FastAPI",
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "GraphQL", "REST API",
  "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Git", "Linux",
  "Tailwind CSS", "Redux", "Zustand", "Prisma", "Mongoose", "PyTorch", "TensorFlow"
];

// Helper function to escape special regex characters safely
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const parseResumePDF = async (filePath: string): Promise<IParsedResume> => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(fileBuffer);
    const rawText = pdfData.text || "";

    // Extract skills safely
    const extractedSkills: string[] = [];
    SKILL_DICTIONARY.forEach((skill) => {
      const escapedSkill = escapeRegex(skill);

      // Alphanumeric skills use standard word boundaries \b
      // Skills with special symbols (like C++) match surrounding whitespace/punctuation
      const isPureWord = /^\w+$/.test(skill);
      const pattern = isPureWord
        ? `\\b${escapedSkill}\\b`
        : `(?:^|\\s|\\b)${escapedSkill}(?:$|\\s|\\b|[,.;])`;

      const regex = new RegExp(pattern, "i");
      if (regex.test(rawText)) {
        extractedSkills.push(skill);
      }
    });

    // Extract basic education keywords
    const educationKeywords: string[] = [];
    const eduTerms = ["Bachelor", "Master", "Ph.D", "B.S.", "M.S.", "B.Tech", "Computer Science", "Engineering"];
    eduTerms.forEach((term) => {
      const escapedTerm = escapeRegex(term);
      if (new RegExp(`\\b${escapedTerm}\\b`, "i").test(rawText)) {
        educationKeywords.push(term);
      }
    });

    return {
      rawText,
      extractedSkills,
      educationKeywords,
      projectKeywords: [],
    };
  } catch (error: any) {
    console.error("[Resume Parser Error Details]:", error);
    throw new Error(`Failed to process resume PDF: ${error.message}`);
  }
};