export const JOB_FORM_SECTIONS = [
  { id: "job-identification", title: "Job Identification" },
  { id: "job-description", title: "Job Description Overview" },
  { id: "job-details", title: "Job Details" },
  { id: "benefits-package", title: "Benefits Package" },
  { id: "basic-information", title: "Basic Information" },
  { id: "background-information-questions", title: "Background Information Questions" },
  { id: "preferred-selection-by-the-employer", title: "Preferred Selection by the Employer" },
] as const;

export const JOB_BENEFIT_OPTIONS = [
  "Home Leave",
  "Travel Benefits",
  "Medical Insurance",
  "Dental Coverage",
  "Flexible Hours",
  "Gym Membership",
  "Transport Allowance",
  "Performance Bonus",
] as const;

export const JOB_ELIMINATION_FIELDS = [
  {
    name: "required_availability",
    label: "What is the required availability?",
    placeholder: "Select Availability",
    options: ["Immediate", "1 week", "2 weeks", "1 Month", "Other"],
  },
  {
    name: "required_age",
    label: "What is the required age range?",
    placeholder: "Select Age Range",
    options: ["18-25", "26-30", "31-35", "36-40", "41-45", "46-50", "51-55", "56-60", "60+", "No preference"],
  },
  {
    name: "required_employment_eligibility_visa",
    label: "What employment eligibility or visa is required?",
    placeholder: "Select Visa Status",
    options: [
      "Singapore citizen",
      "Singapore Permanent Resident",
      "Work Permit",
      "Employment Pass",
      "S Pass",
      "Dependent Pass",
      "Long Term Visit Pass",
      "No preference",
    ],
  },
  {
    name: "required_ethnicity",
    label: "What ethnicity is required?",
    placeholder: "Select Ethnicity",
    options: ["Chinese", "Malay", "Indian", "Eurasian", "Others", "No preference"],
  },
  {
    name: "required_gender",
    label: "What gender is required?",
    placeholder: "Select Gender",
    options: ["Male", "Female", "Other", "Prefer not to say", "No preference"],
  },
  {
    name: "required_race",
    label: "What race is required?",
    placeholder: "Select Race",
    options: ["Chinese", "Malay", "Indian", "Eurasian", "Caucasian", "African", "Hispanic", "Others", "No preference"],
  },
  {
    name: "required_religion",
    label: "What religion is required?",
    placeholder: "Select Religion",
    options: ["Buddhism", "Christianity", "Islam", "Hinduism", "Taoism", "Sikhism", "No Religion", "Others", "No preference"],
  },
  {
    name: "required_birth_country",
    label: "What is the required birth country?",
    placeholder: "Select Birth Country",
    options: ["Singapore", "Malaysia", "China", "India", "Indonesia", "Philippines", "Thailand", "Vietnam", "Others", "No preference"],
  },
  {
    name: "required_current_country",
    label: "What is the required current country?",
    placeholder: "Select Current Country",
    options: ["Singapore", "Malaysia", "China", "India", "Indonesia", "Philippines", "Thailand", "Vietnam", "Others", "No preference"],
  },
  {
    name: "required_current_city",
    label: "What is the required current city?",
    placeholder: "Select Current City",
    options: ["Singapore", "Kuala Lumpur", "Penang", "Johor Bahru", "Jakarta", "Bangkok", "Manila", "Ho Chi Minh", "Others", "No preference"],
  },
  {
    name: "required_months_in_current_country",
    label: "How many months in current country are required?",
    placeholder: "Select Duration",
    options: ["0-6 months", "6-12 months", "1-2 years", "2-3 years", "3-5 years", "5-10 years", "10+ years", "No preference"],
  },
  {
    name: "required_dialect",
    label: "What dialect is required?",
    placeholder: "Select Dialect",
    options: ["Hokkien", "Cantonese", "Teochew", "Hakka", "Hainanese", "Mandarin", "Others", "No preference"],
  },
  {
    name: "required_height",
    label: "What is the required height?",
    placeholder: "Select Height Range",
    options: ["Below 150cm", "150-160cm", "161-170cm", "171-180cm", "181-190cm", "Above 190cm", "No preference"],
  },
  {
    name: "required_weight",
    label: "What is the required weight?",
    placeholder: "Select Weight Range",
    options: ["Below 50kg", "50-60kg", "61-70kg", "71-80kg", "81-90kg", "91-100kg", "Above 100kg", "No preference"],
  },
  {
    name: "required_fitness_level",
    label: "What fitness level is required?",
    placeholder: "Select Fitness Level",
    options: ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extremely Active", "No preference"],
  },
  {
    name: "required_nationality",
    label: "What nationality is required?",
    placeholder: "Select Nationality",
    options: ["Singaporean", "Malaysian", "Chinese", "Indian", "Indonesian", "Filipino", "Thai", "Vietnamese", "Others", "No preference"],
  },
  {
    name: "not_required_nationality",
    label: "What nationality is not required?",
    placeholder: "Select Nationality to Exclude",
    options: ["Singaporean", "Malaysian", "Chinese", "Indian", "Indonesian", "Filipino", "Thai", "Vietnamese", "Others", "No preference"],
  },
  {
    name: "required_work_arrangement",
    label: "What work arrangement is required?",
    placeholder: "Select Work Arrangement",
    options: ["Fully Remote", "Hybrid", "On-site", "Flexible", "No preference"],
  },
] as const;

export const JOB_BACKGROUND_QUESTIONS = [
  { name: "faq_work_life_balance", label: "Does the candidate require work life balance?" },
  { name: "faq_driving_licence", label: "Is a driving licence required?" },
  { name: "faq_car_ownership", label: "Is car ownership required?" },
  { name: "faq_willing_overtime", label: "Is the candidate required to be willing to work overtime?" },
  { name: "faq_need_disability_support", label: "Does the candidate need disability support?" },
  { name: "faq_willing_relocate", label: "Is the candidate required to be willing to relocate?" },
  { name: "faq_willing_background_check", label: "Is the candidate required to be willing to undergo background check?" },
] as const;

export type PreferredFieldConfig = {
  name: string;
  label: string;
  category: string;
  type?: "multilevel" | "text";
  multilevelKey?: "roles" | "domains" | "functions" | "structuralSkills";
};

export const JOB_PREFERRED_FIELDS: PreferredFieldConfig[] = [
  { name: "desired_maximum_salary", label: "Maximum salary", category: "Salary Expectations" },
  { name: "desired_minimum_salary", label: "Minimum salary", category: "Salary Expectations" },
  { name: "desired_past_role_1", label: "What is your preferred role (1)", category: "Preferred Roles", type: "multilevel", multilevelKey: "roles" },
  { name: "desired_past_role_2", label: "What is your preferred role (2)", category: "Preferred Roles", type: "multilevel", multilevelKey: "roles" },
  { name: "desired_past_role_3", label: "What is your preferred role (3)", category: "Preferred Roles", type: "multilevel", multilevelKey: "roles" },
  { name: "desired_past_domain_1", label: "What is your preferred domain (1)", category: "Preferred Domains", type: "multilevel", multilevelKey: "domains" },
  { name: "desired_past_domain_2", label: "What is your preferred domain (2)", category: "Preferred Domains", type: "multilevel", multilevelKey: "domains" },
  { name: "desired_past_domain_3", label: "What is your preferred domain (3)", category: "Preferred Domains", type: "multilevel", multilevelKey: "domains" },
  { name: "desired_past_function_1", label: "What is your preferred function (1)", category: "Preferred Functions", type: "multilevel", multilevelKey: "functions" },
  { name: "desired_past_function_2", label: "What is your preferred function (2)", category: "Preferred Functions", type: "multilevel", multilevelKey: "functions" },
  { name: "desired_past_function_3", label: "What is your preferred function (3)", category: "Preferred Functions", type: "multilevel", multilevelKey: "functions" },
  { name: "desired_past_hierarchy_1", label: "What is your preferred hierarchy level (1)", category: "Preferred Hierarchy" },
  { name: "desired_past_hierarchy_2", label: "What is your preferred hierarchy level (2)", category: "Preferred Hierarchy" },
  { name: "desired_past_hierarchy_3", label: "What is your preferred hierarchy level (3)", category: "Preferred Hierarchy" },
  { name: "desired_past_structural_skill_1", label: "What is your preferred structural skill (1)", category: "Preferred Structural Skills", type: "multilevel", multilevelKey: "structuralSkills" },
  { name: "desired_past_structural_skill_2", label: "What is your preferred structural skill (2)", category: "Preferred Structural Skills", type: "multilevel", multilevelKey: "structuralSkills" },
  { name: "desired_past_structural_skill_3", label: "What is your preferred structural skill (3)", category: "Preferred Structural Skills", type: "multilevel", multilevelKey: "structuralSkills" },
  { name: "desired_past_systems_skill_1", label: "What is your preferred systems skill (1)", category: "Preferred Systems Skills" },
  { name: "desired_past_systems_skill_2", label: "What is your preferred systems skill (2)", category: "Preferred Systems Skills" },
  { name: "desired_past_systems_skill_3", label: "What is your preferred systems skill (3)", category: "Preferred Systems Skills" },
  { name: "desired_past_title_1", label: "What is your preferred job title (1)", category: "Preferred Job Titles" },
  { name: "desired_past_title_2", label: "What is your preferred job title (2)", category: "Preferred Job Titles" },
  { name: "desired_past_title_3", label: "What is your preferred job title (3)", category: "Preferred Job Titles" },
  { name: "desired_past_values_1", label: "What are your preferred values (1)", category: "Preferred Values" },
  { name: "desired_past_values_2", label: "What are your preferred values (2)", category: "Preferred Values" },
  { name: "desired_past_values_3", label: "What are your preferred values (3)", category: "Preferred Values" },
  { name: "desired_past_motivation_1", label: "What is your preferred motivation (1)", category: "Preferred Motivation" },
  { name: "desired_past_motivation_2", label: "What is your preferred motivation (2)", category: "Preferred Motivation" },
  { name: "desired_past_motivation_3", label: "What is your preferred motivation (3)", category: "Preferred Motivation" },
  { name: "desired_talent_1", label: "What is your preferred talent (1)", category: "Preferred Talent" },
  { name: "desired_talent_2", label: "What is your preferred talent (2)", category: "Preferred Talent" },
  { name: "desired_talent_3", label: "What is your preferred talent (3)", category: "Preferred Talent" },
  { name: "desired_education_subject_1", label: "What is your preferred education subject (1)", category: "Preferred Education" },
  { name: "desired_education_subject_2", label: "What is your preferred education subject (2)", category: "Preferred Education" },
  { name: "desired_education_subject_3", label: "What is your preferred education subject (3)", category: "Preferred Education" },
  { name: "desired_university_major", label: "What is your preferred university major?", category: "Preferred Education" },
  { name: "desired_university_ranking", label: "What is your preferred university ranking?", category: "Preferred Education" },
  { name: "desired_hobby_1", label: "What is your preferred hobby (1)", category: "Preferred Personal" },
  { name: "desired_hobby_2", label: "What is your preferred hobby (2)", category: "Preferred Personal" },
  { name: "desired_hobby_3", label: "What is your preferred hobby (3)", category: "Preferred Personal" },
];

export const JOB_PREFERRED_CATEGORY_ORDER = [
  "Salary Expectations",
  "Preferred Roles",
  "Preferred Domains",
  "Preferred Functions",
  "Preferred Hierarchy",
  "Preferred Structural Skills",
  "Preferred Systems Skills",
  "Preferred Job Titles",
  "Preferred Values",
  "Preferred Motivation",
  "Preferred Talent",
  "Preferred Education",
  "Preferred Personal",
] as const;

export function groupPreferredFields() {
  const grouped: Record<string, PreferredFieldConfig[]> = {};
  for (const field of JOB_PREFERRED_FIELDS) {
    grouped[field.category] ??= [];
    grouped[field.category].push(field);
  }
  return JOB_PREFERRED_CATEGORY_ORDER.filter((category) => grouped[category]?.length).map(
    (category) => [category, grouped[category]] as const
  );
}
