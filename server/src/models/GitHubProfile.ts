import { Schema, model, Document, Types } from "mongoose";

export interface IGitHubProfile extends Document {
  userId: Types.ObjectId;
  username: string;
  publicRepos: number;
  followers: number;
  repositories: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
  }>;
  estimatedLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

const GitHubProfileSchema = new Schema<IGitHubProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    repositories: [
      {
        name: String,
        description: String,
        language: String,
        stars: Number,
        forks: Number,
      },
    ],
    estimatedLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate",
    },
  },
  { timestamps: true }
);

export const GitHubProfile = model<IGitHubProfile>("GitHubProfile", GitHubProfileSchema);