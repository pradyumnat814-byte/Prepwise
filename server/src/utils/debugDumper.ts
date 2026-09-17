import fs from "fs";
import path from "path";

export const saveScrapedDataDebug = (data: {
  source: "resume" | "github" | "combined_profile";
  candidateName?: string;
  githubUsername?: string;
  rawExtractedText?: string;
  scrapedGithubData?: any;
  extractedSkills?: string[];
  fullProfile?: any;
}) => {
  try {
    const debugDir = path.join(process.cwd(), "debug_dumps");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    const filename = `scraped_profile_${Date.now()}.json`;
    const filePath = path.join(debugDir, filename);

    const payload = {
      timestamp: new Date().toISOString(),
      ...data,
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
    console.log(`\x1b[32m[Scraper Debug Saved]\x1b[0m File written to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("[Scraper Debug Error]: Failed to write scraped data to file:", error);
  }
};