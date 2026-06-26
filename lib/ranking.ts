import { Timestamp } from "firebase/firestore";

export interface WorkerMetrics {
  id: string;
  name: string;
  mobile: string;
  serviceType: string;
  area: string;
  experience: number;
  rating: number;
  totalReviews: number;
  totalAssignedJobs: number;
  totalAcceptedJobs: number;
  totalRejectedJobs: number;
  totalCompletedJobs: number;
  lastActivity: Timestamp | { seconds: number; nanoseconds: number } | null;
  status: "active" | "suspended" | "removed";
  createdAt: Timestamp;
}

/**
 * Calculates the activity status of a worker based on their last activity timestamp.
 * Active: <= 7 days
 * Low Activity: 8 to 30 days
 * Inactive: > 30 days
 */
export function getWorkerActivityStatus(
  lastActivity: Timestamp | { seconds: number; nanoseconds: number } | null
): "Active" | "Low Activity" | "Inactive" {
  if (!lastActivity) return "Active";

  const seconds = "seconds" in lastActivity ? lastActivity.seconds : (lastActivity as Timestamp).seconds;
  const lastActiveDate = new Date(seconds * 1000);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastActiveDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    return "Active";
  } else if (diffDays <= 30) {
    return "Low Activity";
  } else {
    return "Inactive";
  }
}

/**
 * Calculates the dynamic Ranking Score for a worker out of 100.
 * Weight Distribution:
 * - Rating: 40% (normalized)
 * - Completion Rate: 25% (Completed Jobs / Accepted Jobs)
 * - Acceptance Rate: 15% (Accepted Jobs / Assigned Jobs)
 * - Total Completed Jobs: 10% (Cap at 5 jobs for full score, i.e., 2 points per job)
 * - Recent Activity: 10% (Active = 10, Low = 5, Inactive = 0)
 */
export function calculateRankingScore(worker: WorkerMetrics): number {
  if (worker.status === "suspended" || worker.status === "removed") {
    return 0;
  }

  // 1. Rating Score (40% weight)
  // Rating is out of 5 stars.
  const ratingScore = (worker.rating / 5.0) * 40;

  // 2. Completion Rate Score (25% weight)
  const completionRate =
    worker.totalAcceptedJobs > 0
      ? (worker.totalCompletedJobs / worker.totalAcceptedJobs) * 100
      : 100; // Default to 100 for new workers so they aren't penalized
  const completionScore = (completionRate / 100) * 25;

  // 3. Acceptance Rate Score (15% weight)
  const acceptanceRate =
    worker.totalAssignedJobs > 0
      ? (worker.totalAcceptedJobs / worker.totalAssignedJobs) * 100
      : 100; // Default to 100 for new workers
  const acceptanceScore = (acceptanceRate / 100) * 15;

  // 4. Completed Jobs Volume Score (10% weight)
  // Give 2 points per completed job, capped at 10 points (5 completed jobs)
  const completedJobsScore = Math.min((worker.totalCompletedJobs || 0) * 2, 10);

  // 5. Recent Activity Score (10% weight)
  const activityStatus = getWorkerActivityStatus(worker.lastActivity);
  let activityScore = 0;
  if (activityStatus === "Active") {
    activityScore = 10;
  } else if (activityStatus === "Low Activity") {
    activityScore = 5;
  } else {
    activityScore = 0;
  }

  const finalScore =
    ratingScore +
    completionScore +
    acceptanceScore +
    completedJobsScore +
    activityScore;

  return Math.round(finalScore * 10) / 10; // Round to 1 decimal place
}
