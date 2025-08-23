import { SEEKER_PLANS } from "../content/common/plans";

export async function hasPaidForPlan(userId: number, planId: number) {
  // Get all completed transactions for the user
  // const transactions = await prisma.transaction.findMany({
  //   where: {
  //     userId,
  //     status: "completed",
  //   },
  //   select: {
  //     planId: true,
  //   },
  // });

  // const userPlanIds = transactions.map((t) => t.planId);

  // Check if user has direct access to the requested plan
  // const hasDirectAccess = userPlanIds.includes(planId);

  // if (hasDirectAccess) {
  //   return true;
  // }

  // Check if user has access through bundle plans
  // const hasBundleAccess = userPlanIds.some((userPlanId) => {
  //   const userPlan = SEEKER_PLANS.find((plan) => plan.id === userPlanId);
  //   if (!userPlan || !userPlan.feature || userPlan.feature.length === 0) {
  //     return false;
  //   }

  //   // Check if the requested plan is included as a feature in this bundle
  //   return userPlan.feature.some((feature) => feature.id === planId);
  // });

  // return hasBundleAccess;
}
