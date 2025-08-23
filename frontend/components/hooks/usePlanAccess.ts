import { useState, useEffect } from "react";
import { useCheckPlanAccess } from "../queries/mutation";
import { useCookies } from "@/hooks/cookie";

export const usePlanAccess = (planIds: number[]) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useCookies();
  const { mutate: checkPlanAccess } = useCheckPlanAccess();

  useEffect(() => {
    if (!user) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }

    // If no plans required, user has access
    if (planIds.length === 0) {
      setHasAccess(true);
      setIsLoading(false);
      return;
    }

    // Check each plan access
    const checkAllPlans = async () => {
      let hasAnyPlan = false;

      for (const planId of planIds) {
        try {
          const result = await new Promise<{ hasAccess: boolean }>(
            (resolve, reject) => {
              checkPlanAccess(
                { planId },
                {
                  onSuccess: (data) => resolve(data),
                  onError: (error) => reject(error),
                }
              );
            }
          );

          if (result && result.hasAccess) {
            hasAnyPlan = true;
            break;
          }
        } catch (error) {
          console.error("Error checking plan access:", error);
        }
      }

      setHasAccess(hasAnyPlan);
      setIsLoading(false);
    };

    checkAllPlans();
  }, [planIds, checkPlanAccess, user]);

  return { hasAccess, isLoading, currentUser: user };
};
