import { Schema, model, Document, Types } from "mongoose";

export interface IResume extends Document {
  userId: Types.ObjectId;
  filePath: string;
  rawText: string;
  parsedData: {
    skills: string[];
    experience: string[];
    education: string[];
    projects: string[];
  };
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    filePath: { type: String, required: true },
    rawText: { type: String, required: true },
    parsedData: {
      skills: [{ type: String }],
      experience: [{ type: String }],
      education: [{ type: String }],
      projects: [{ type: String }],
    },
  },
  { timestamps: true }
);

export const Resume = model<IResume>("Resume", ResumeSchema);