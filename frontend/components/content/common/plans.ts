export interface Plan {
  id: number;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export const SEEKER_PLANS: Plan[] = [
  {
    id: 1,
    name: "Free Plan",
    price: 0,
    description: "Basic features available for free",
    features: [
      "Profile creation",
      "Resume creation (1 resume)",
      "Company search",
      "Applications (5 per month)"
    ]
  },
  {
    id: 2,
    name: "Standard Plan",
    price: 2980,
    description: "All basic features available",
    features: [
      "Profile creation",
      "Unlimited resume creation",
      "Company search",
      "Unlimited applications",
      "Scout reception",
      "Message feature"
    ]
  },
  {
    id: 3,
    name: "Premium Plan",
    price: 5980,
    description: "Strong support for job hunting",
    features: [
      "All Standard Plan features",
      "Resume review service",
      "Interview preparation advice",
      "Priority support",
      "Company recommendation",
      "Access to private job listings"
    ]
  }
];

export const COMPANY_PLANS: Plan[] = [
  {
    id: 11,
    name: "Trial Plan",
    price: 0,
    description: "Try our service for free",
    features: [
      "Seeker search (10 per month)",
      "Scout sending (3 per month)",
      "Applicant management"
    ]
  },
  {
    id: 12,
    name: "Basic Plan",
    price: 19800,
    description: "Standard plan for small to medium businesses",
    features: [
      "Unlimited seeker search",
      "Scout sending (50 per month)",
      "Applicant management",
      "Message feature",
      "Recruitment dashboard"
    ]
  },
  {
    id: 13,
    name: "Enterprise Plan",
    price: 49800,
    description: "Comprehensive plan for large enterprises",
    features: [
      "All Basic Plan features",
      "Unlimited scout sending",
      "AI matching feature",
      "Recruitment analytics reports",
      "Dedicated support",
      "API integration",
      "Multiple account management"
    ]
  }
];