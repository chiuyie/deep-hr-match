export const JOB_FORM_NO_FILTER_VALUE = "No preference" as const;

export const JOB_FORM_SECTIONS = [
  { id: "job-identification", title: "Role basics" },
  { id: "job-details", title: "Job details" },
  { id: "compensation", title: "Compensation & benefits" },
  { id: "basic-information", title: "Matching filters" },
  { id: "background-information-questions", title: "Role requirements" },
  { id: "preferred-selection-by-the-employer", title: "Improve match ranking (optional)" },
] as const;

export const JOB_IMPORTANCE_LEVEL_OPTIONS = ["High", "Medium", "Low"] as const;

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
    label: "Required availability",
    placeholder: "Select availability",
    options: ["Immediate", "1 week", "2 weeks", "1 Month", "Other", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_age",
    label: "Required age range",
    placeholder: "Select age range",
    options: ["18-25", "26-30", "31-35", "36-40", "41-45", "46-50", "51-55", "56-60", "60+", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_employment_eligibility_visa",
    label: "Required work pass / eligibility",
    placeholder: "Select visa status",
    options: [
      "Singapore citizen",
      "Singapore Permanent Resident",
      "Work Permit",
      "Employment Pass",
      "S Pass",
      "Dependent Pass",
      "Long Term Visit Pass",
      JOB_FORM_NO_FILTER_VALUE,
    ],
  },
  {
    name: "required_ethnicity",
    label: "Ethnicity filter (if legally required)",
    placeholder: "Select ethnicity",
    options: ["Chinese", "Malay", "Indian", "Eurasian", "Others", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_gender",
    label: "Gender filter (if legally required)",
    placeholder: "Select gender",
    options: ["Male", "Female", "Other", "Prefer not to say", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_race",
    label: "Race filter (if legally required)",
    placeholder: "Select race",
    options: ["Chinese", "Malay", "Indian", "Eurasian", "Caucasian", "African", "Hispanic", "Others", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_religion",
    label: "Religion filter (if legally required)",
    placeholder: "Select religion",
    options: ["Buddhism", "Christianity", "Islam", "Hinduism", "Taoism", "Sikhism", "No Religion", "Others", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_birth_country",
    label: "Required birth country",
    placeholder: "Select birth country",
    options: ["Singapore", "Malaysia", "China", "India", "Indonesia", "Philippines", "Thailand", "Vietnam", "Others", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_current_country",
    label: "Required current country",
    placeholder: "Select current country",
    options: ["Singapore", "Malaysia", "China", "India", "Indonesia", "Philippines", "Thailand", "Vietnam", "Others", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_current_city",
    label: "Required current city",
    placeholder: "Select current city",
    options: ["Singapore", "Kuala Lumpur", "Penang", "Johor Bahru", "Jakarta", "Bangkok", "Manila", "Ho Chi Minh", "Others", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_months_in_current_country",
    label: "Minimum time in current country",
    placeholder: "Select duration",
    options: ["0-6 months", "6-12 months", "1-2 years", "2-3 years", "3-5 years", "5-10 years", "10+ years", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_dialect",
    label: "Required dialect",
    placeholder: "Select dialect",
    options: ["Hokkien", "Cantonese", "Teochew", "Hakka", "Hainanese", "Mandarin", "Others", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_height",
    label: "Height filter (use only if essential)",
    placeholder: "Select height range",
    options: ["Below 150cm", "150-160cm", "161-170cm", "171-180cm", "181-190cm", "Above 190cm", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_weight",
    label: "Weight filter (use only if essential)",
    placeholder: "Select weight range",
    options: ["Below 50kg", "50-60kg", "61-70kg", "71-80kg", "81-90kg", "91-100kg", "Above 100kg", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_fitness_level",
    label: "Required fitness level",
    placeholder: "Select fitness level",
    options: ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extremely Active", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "required_nationality",
    label: "Required nationality",
    placeholder: "Select nationality",
    options: ["Singaporean", "Malaysian", "Chinese", "Indian", "Indonesian", "Filipino", "Thai", "Vietnamese", "Others", JOB_FORM_NO_FILTER_VALUE],
  },
  {
    name: "not_required_nationality",
    label: "Nationalities to exclude",
    placeholder: "Select nationality to exclude",
    options: ["Singaporean", "Malaysian", "Chinese", "Indian", "Indonesian", "Filipino", "Thai", "Vietnamese", "Others"],
  },
  {
    name: "required_work_arrangement",
    label: "Required work arrangement",
    placeholder: "Select work arrangement",
    options: ["Fully Remote", "Hybrid", "On-site", "Flexible", JOB_FORM_NO_FILTER_VALUE],
  },
] as const;

export const JOB_BACKGROUND_QUESTIONS = [
  { name: "faq_work_life_balance", label: "Is work-life balance a must-have for this role?" },
  { name: "faq_driving_licence", label: "Is a driving licence required?" },
  { name: "faq_car_ownership", label: "Is car ownership required?" },
  { name: "faq_willing_overtime", label: "Must candidates be willing to work overtime?" },
  { name: "faq_need_disability_support", label: "Will the role provide disability support if needed?" },
  { name: "faq_willing_relocate", label: "Must candidates be willing to relocate?" },
  { name: "faq_willing_background_check", label: "Must candidates agree to a background check?" },
] as const;

export type PreferredFieldConfig = {
  name: string;
  label: string;
  category: string;
  type?: "multilevel" | "text";
  multilevelKey?: "roles" | "domains" | "functions" | "structuralSkills";
  placeholder?: string;
};

export const JOB_PREFERRED_FIELDS: PreferredFieldConfig[] = [
  {
    name: "desired_past_role_1",
    label: "Ideal past role for candidates (1)",
    category: "Ideal candidate roles",
    type: "multilevel",
    multilevelKey: "roles",
  },
  {
    name: "desired_past_role_2",
    label: "Ideal past role for candidates (2)",
    category: "Ideal candidate roles",
    type: "multilevel",
    multilevelKey: "roles",
  },
  {
    name: "desired_past_role_3",
    label: "Ideal past role for candidates (3)",
    category: "Ideal candidate roles",
    type: "multilevel",
    multilevelKey: "roles",
  },
  {
    name: "desired_past_domain_1",
    label: "Ideal domain experience (1)",
    category: "Ideal candidate domains",
    type: "multilevel",
    multilevelKey: "domains",
  },
  {
    name: "desired_past_domain_2",
    label: "Ideal domain experience (2)",
    category: "Ideal candidate domains",
    type: "multilevel",
    multilevelKey: "domains",
  },
  {
    name: "desired_past_domain_3",
    label: "Ideal domain experience (3)",
    category: "Ideal candidate domains",
    type: "multilevel",
    multilevelKey: "domains",
  },
  {
    name: "desired_past_function_1",
    label: "Ideal function experience (1)",
    category: "Ideal candidate functions",
    type: "multilevel",
    multilevelKey: "functions",
  },
  {
    name: "desired_past_function_2",
    label: "Ideal function experience (2)",
    category: "Ideal candidate functions",
    type: "multilevel",
    multilevelKey: "functions",
  },
  {
    name: "desired_past_function_3",
    label: "Ideal function experience (3)",
    category: "Ideal candidate functions",
    type: "multilevel",
    multilevelKey: "functions",
  },
  { name: "desired_past_hierarchy_1", label: "Ideal seniority / level (1)", category: "Ideal seniority" },
  { name: "desired_past_hierarchy_2", label: "Ideal seniority / level (2)", category: "Ideal seniority" },
  { name: "desired_past_hierarchy_3", label: "Ideal seniority / level (3)", category: "Ideal seniority" },
  {
    name: "desired_past_structural_skill_1",
    label: "Ideal structural skill (1)",
    category: "Ideal structural skills",
    type: "multilevel",
    multilevelKey: "structuralSkills",
  },
  {
    name: "desired_past_structural_skill_2",
    label: "Ideal structural skill (2)",
    category: "Ideal structural skills",
    type: "multilevel",
    multilevelKey: "structuralSkills",
  },
  {
    name: "desired_past_structural_skill_3",
    label: "Ideal structural skill (3)",
    category: "Ideal structural skills",
    type: "multilevel",
    multilevelKey: "structuralSkills",
  },
  { name: "desired_past_systems_skill_1", label: "Ideal systems skill (1)", category: "Ideal systems skills" },
  { name: "desired_past_systems_skill_2", label: "Ideal systems skill (2)", category: "Ideal systems skills" },
  { name: "desired_past_systems_skill_3", label: "Ideal systems skill (3)", category: "Ideal systems skills" },
  { name: "desired_past_title_1", label: "Ideal previous job title (1)", category: "Ideal job titles" },
  { name: "desired_past_title_2", label: "Ideal previous job title (2)", category: "Ideal job titles" },
  { name: "desired_past_title_3", label: "Ideal previous job title (3)", category: "Ideal job titles" },
  { name: "desired_past_values_1", label: "Ideal values fit (1)", category: "Ideal values" },
  { name: "desired_past_values_2", label: "Ideal values fit (2)", category: "Ideal values" },
  { name: "desired_past_values_3", label: "Ideal values fit (3)", category: "Ideal values" },
  { name: "desired_past_motivation_1", label: "Ideal motivation fit (1)", category: "Ideal motivation" },
  { name: "desired_past_motivation_2", label: "Ideal motivation fit (2)", category: "Ideal motivation" },
  { name: "desired_past_motivation_3", label: "Ideal motivation fit (3)", category: "Ideal motivation" },
  { name: "desired_talent_1", label: "Ideal talent signal (1)", category: "Ideal talent" },
  { name: "desired_talent_2", label: "Ideal talent signal (2)", category: "Ideal talent" },
  { name: "desired_talent_3", label: "Ideal talent signal (3)", category: "Ideal talent" },
  {
    name: "desired_education_subject_1",
    label: "Ideal education subject (1)",
    category: "Ideal education",
  },
  {
    name: "desired_education_subject_2",
    label: "Ideal education subject (2)",
    category: "Ideal education",
  },
  {
    name: "desired_education_subject_3",
    label: "Ideal education subject (3)",
    category: "Ideal education",
  },
  {
    name: "desired_university_major",
    label: "Ideal university major",
    category: "Ideal education",
  },
  {
    name: "desired_university_ranking",
    label: "Ideal university ranking tier",
    category: "Ideal education",
  },
  { name: "desired_hobby_1", label: "Ideal interest / hobby (1)", category: "Ideal personal interests" },
  { name: "desired_hobby_2", label: "Ideal interest / hobby (2)", category: "Ideal personal interests" },
  { name: "desired_hobby_3", label: "Ideal interest / hobby (3)", category: "Ideal personal interests" },
];

export const JOB_PREFERRED_CATEGORY_ORDER = [
  "Ideal candidate roles",
  "Ideal candidate domains",
  "Ideal candidate functions",
  "Ideal seniority",
  "Ideal structural skills",
  "Ideal systems skills",
  "Ideal job titles",
  "Ideal values",
  "Ideal motivation",
  "Ideal talent",
  "Ideal education",
  "Ideal personal interests",
] as const;

export const JOB_PREFERRED_CATEGORY_GUIDANCE: Record<
  (typeof JOB_PREFERRED_CATEGORY_ORDER)[number],
  { shortTitle: string; intro: string }
> = {
  "Ideal candidate roles": {
    shortTitle: "Past roles",
    intro:
      "Backgrounds you would rank higher—previous job families or roles you want to see. Leave blank if not important.",
  },
  "Ideal candidate domains": {
    shortTitle: "Industry / domain",
    intro: "Industries or domains where ideal candidates should have experience.",
  },
  "Ideal candidate functions": {
    shortTitle: "Job function",
    intro: "Functions (e.g. sales, engineering) you prefer candidates to have worked in.",
  },
  "Ideal seniority": {
    shortTitle: "Seniority level",
    intro: "Seniority or level that fits this opening.",
  },
  "Ideal structural skills": {
    shortTitle: "Structural skills",
    intro: "Framework skills from the matching language that matter most for this role.",
  },
  "Ideal systems skills": {
    shortTitle: "Systems skills",
    intro: "Tools, platforms, or systems experience you want to prioritize.",
  },
  "Ideal job titles": {
    shortTitle: "Previous titles",
    intro: "Job titles you like to see in a candidate’s work history.",
  },
  "Ideal values": {
    shortTitle: "Values fit",
    intro: "Values or culture traits you want reflected in candidate profiles.",
  },
  "Ideal motivation": {
    shortTitle: "Motivation",
    intro: "Motivations or drivers that align with this role.",
  },
  "Ideal talent": {
    shortTitle: "Talent signals",
    intro: "Talent indicators you use to spot strong fits.",
  },
  "Ideal education": {
    shortTitle: "Education",
    intro: "Education subjects, majors, or ranking tiers—for ranking only, not elimination.",
  },
  "Ideal personal interests": {
    shortTitle: "Personal interests",
    intro: "Optional interests that may correlate with team fit.",
  },
};

export function getPreferredCategoryGuidance(category: string) {
  return JOB_PREFERRED_CATEGORY_GUIDANCE[
    category as (typeof JOB_PREFERRED_CATEGORY_ORDER)[number]
  ];
}

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
