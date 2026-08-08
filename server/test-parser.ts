import { parseResumePDF } from "./src/services/resume/resumeParser";

// Use file path passed via command line, or default to s1.pdf
const filePath = process.argv[2] || "/home/pradyumna-tiwari/Downloads/s1.pdf";

console.log(`\n🔍 Testing Resume Parser on file: ${filePath}\n`);

async function runTest() {
  try {
    const result = await parseResumePDF(filePath);

    console.log("--------------------------------------------------");
    console.log("1. RAW TEXT PREVIEW (First 400 characters):");
    console.log("--------------------------------------------------");
    console.log(result.rawText.trim().substring(0, 400) || "[EMPTY TEXT EXTRACTED]");
    console.log("--------------------------------------------------\n");

    console.log("--------------------------------------------------");
    console.log("2. EXTRACTED SKILLS MATCHED:");
    console.log("--------------------------------------------------");
    console.log(result.extractedSkills.length > 0 ? result.extractedSkills : "None matched");
    console.log("--------------------------------------------------\n");

    console.log("--------------------------------------------------");
    console.log("3. EDUCATION KEYWORDS MATCHED:");
    console.log("--------------------------------------------------");
    console.log(result.educationKeywords.length > 0 ? result.educationKeywords : "None matched");
    console.log("--------------------------------------------------\n");

  } catch (error) {
    console.error("❌ Error parsing resume:", error);
  }
}

runTest();