import type { SurveyCategory } from "./panelist-surveys-types";
import type { SurveyQuestion } from "./survey-types";
import {
  dropdown,
  instantiateTemplateQuestions,
  longText,
  multi,
  scale,
  shortText,
  single,
  yesNo,
  type TemplateQuestionDraft,
} from "./survey-template-builders";

export type SurveyTemplateTopicId =
  | "audience_evaluation"
  | "basic_pack"
  | "customer_satisfaction"
  | "education_surveys"
  | "employee_feedback"
  | "event_planning_feedback"
  | "incident_follow_up"
  | "industry_specific"
  | "most_popular"
  | "nonprofit_membership"
  | "readership_satisfaction"
  | "shopping_experience"
  | "product_testing"
  | "website_feedback";

export interface SurveyTemplateTopic {
  id: SurveyTemplateTopicId;
  label: string;
}

export interface SurveyTemplate {
  id: string;
  topicId: SurveyTemplateTopicId;
  title: string;
  description: string;
  companyIntro?: string;
  category: SurveyCategory;
  questions: TemplateQuestionDraft[];
}

export const SURVEY_TEMPLATE_TOPICS: SurveyTemplateTopic[] = [
  { id: "audience_evaluation", label: "Audience evaluation" },
  { id: "basic_pack", label: "Basic pack" },
  { id: "customer_satisfaction", label: "Customer satisfaction" },
  { id: "education_surveys", label: "Education surveys" },
  { id: "employee_feedback", label: "Employee feedback" },
  { id: "event_planning_feedback", label: "Event planning & feedback" },
  { id: "incident_follow_up", label: "Incident follow-up" },
  { id: "industry_specific", label: "Industry specific" },
  { id: "most_popular", label: "Most popular surveys" },
  { id: "nonprofit_membership", label: "Non-profit & membership" },
  { id: "readership_satisfaction", label: "Readership satisfaction" },
  { id: "shopping_experience", label: "Shopping experience" },
  { id: "product_testing", label: "Testing new products & services" },
  { id: "website_feedback", label: "Website feedback" },
];

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: "understanding-your-audience",
    topicId: "audience_evaluation",
    title: "Understanding your audience",
    description: "Profile your audience demographics, interests, and communication preferences.",
    category: "market",
    questions: [
      single("What is your age group?", ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"]),
      single("Which district do you live in?", ["Belize District", "Cayo", "Corozal", "Orange Walk", "Stann Creek", "Toledo", "Other"]),
      multi("Which topics interest you most? (Select all that apply)", [
        "Politics & governance",
        "Community development",
        "Health & wellness",
        "Education",
        "Business & economy",
        "Environment",
      ]),
      scale("I actively seek out research opportunities to share my opinions."),
      scale("I trust online surveys to represent my views accurately."),
      single("How do you prefer to receive survey invitations?", ["Email", "SMS / WhatsApp", "In-app notification", "Phone call"]),
      yesNo("Have you participated in a research panel before?"),
      longText("What would motivate you to stay active in a research panel?"),
    ],
  },
  {
    id: "training-program-interest",
    topicId: "audience_evaluation",
    title: "Training program interest",
    description: "Gauge interest in workshops, courses, and professional development programs.",
    category: "civic",
    questions: [
      yesNo("Are you currently employed or studying?"),
      single("Which training format interests you most?", ["In-person workshop", "Online live session", "Self-paced online", "Hybrid"]),
      multi("Which subject areas interest you? (Select all that apply)", [
        "Digital skills",
        "Leadership & management",
        "Financial literacy",
        "Customer service",
        "Technical / vocational",
        "Language skills",
      ]),
      scale("I would pay a fee for high-quality professional training."),
      single("Preferred session length", ["1–2 hours", "Half day", "Full day", "Multi-day program"]),
      dropdown("How soon would you like to start?", ["Within 1 month", "1–3 months", "3–6 months", "No specific timeline"]),
      scale("Weekend sessions are convenient for me."),
      single("Maximum budget per course (BZ$)", ["Free only", "Under BZ$50", "BZ$50–150", "BZ$150–300", "Over BZ$300"]),
      yesNo("Would you recommend employer-sponsored training?"),
      longText("Describe the training topic you need most right now."),
    ],
  },
  {
    id: "professional-service-interest",
    topicId: "audience_evaluation",
    title: "Professional service interest",
    description: "Measure demand for consulting, advisory, and professional services.",
    category: "market",
    questions: [
      single("Your organization type", ["Government", "Private business", "NGO / non-profit", "Self-employed", "Student", "Other"]),
      multi("Which services are you most likely to use? (Select all that apply)", [
        "Market research",
        "Data analysis",
        "Strategic planning",
        "Training & facilitation",
        "Survey design",
        "Policy evaluation",
      ]),
      scale("External professional support would help my organization make better decisions."),
      single("Typical project budget", ["Under BZ$1,000", "BZ$1,000–5,000", "BZ$5,000–15,000", "Over BZ$15,000"]),
      yesNo("Have you hired a research or consulting firm in the past 2 years?"),
      scale("Quality of service matters more than lowest price."),
      single("Preferred engagement length", ["One-off project", "3–6 months", "Annual retainer", "Not sure"]),
      dropdown("Decision timeline", ["Immediately", "Within 3 months", "6–12 months", "Just exploring"]),
      shortText("Organization or business name (optional)", { required: false }),
      longText("What outcome would a professional service need to deliver for you?"),
    ],
  },
  {
    id: "member-program-interest",
    topicId: "audience_evaluation",
    title: "Member program interest",
    description: "Assess interest in membership benefits, tiers, and engagement activities.",
    category: "civic",
    questions: [
      yesNo("Are you currently a member of any association or club?"),
      multi("Which member benefits matter most? (Select all that apply)", [
        "Discounts & perks",
        "Networking events",
        "Exclusive content",
        "Voting rights",
        "Training access",
        "Community projects",
      ]),
      scale("I would pay an annual membership fee for valuable benefits."),
      single("Preferred membership tier", ["Basic (free)", "Standard", "Premium", "Corporate"]),
      single("How often would you attend member events?", ["Monthly", "Quarterly", "Twice a year", "Rarely"]),
      dropdown("Preferred communication channel", ["Email newsletter", "WhatsApp group", "Mobile app", "In-person meetings"]),
      scale("Member input should shape program priorities."),
      yesNo("Would you volunteer time for association activities?"),
      shortText("Which association or program are you referring to?", { required: false }),
      longText("What would make membership worthwhile for you?"),
      scale("I would refer friends to join a well-run member program."),
    ],
  },
  {
    id: "customer-interest",
    topicId: "audience_evaluation",
    title: "Customer interest",
    description: "Quick pulse on product interest, purchase intent, and awareness.",
    category: "market",
    questions: [
      yesNo("Are you aware of this product or service?"),
      scale("This product or service would meet a need I have."),
      single("How likely are you to purchase in the next 3 months?", [
        "Very likely",
        "Somewhat likely",
        "Not sure",
        "Unlikely",
        "Very unlikely",
      ]),
      single("Price sensitivity", ["Very price sensitive", "Somewhat price sensitive", "Quality matters more than price"]),
      multi("Where would you expect to buy? (Select all that apply)", ["Online", "Retail store", "Direct sales", "Through an agent"]),
      longText("What is the main reason you would or would not be interested?"),
    ],
  },
  {
    id: "quick-feedback-snapshot",
    topicId: "basic_pack",
    title: "Quick feedback snapshot",
    description: "A short five-question template for fast feedback on any topic.",
    category: "civic",
    questions: [
      scale("Overall, I am satisfied with this experience."),
      single("How did you hear about us?", ["Friend or family", "Social media", "Website", "Advertisement", "Other"]),
      yesNo("Would you use this again?"),
      scale("This was easy to understand and complete."),
      longText("Any additional comments?"),
    ],
  },
  {
    id: "demographics-basics",
    topicId: "basic_pack",
    title: "Demographics basics",
    description: "Standard demographic and household questions for panel profiling.",
    category: "civic",
    questions: [
      single("Gender", ["Female", "Male", "Non-binary / other", "Prefer not to say"]),
      single("Highest education completed", ["Primary", "Secondary", "Associate", "Bachelor's", "Graduate", "Other"]),
      single("Employment status", ["Employed full-time", "Employed part-time", "Self-employed", "Student", "Unemployed", "Retired"]),
      single("Household size", ["1", "2", "3–4", "5+"]),
      yesNo("Are you the primary decision maker for household purchases?"),
      dropdown("Household income range (monthly, BZ$)", ["Under 1,000", "1,000–2,500", "2,500–5,000", "5,000–10,000", "Over 10,000", "Prefer not to say"]),
    ],
  },
  {
    id: "net-promoter-style",
    topicId: "customer_satisfaction",
    title: "Customer satisfaction (NPS-style)",
    description: "Measure satisfaction, likelihood to recommend, and follow-up drivers.",
    category: "market",
    questions: [
      scale("How satisfied are you with your overall experience?", {
        scaleMinLabel: "Very dissatisfied",
        scaleMaxLabel: "Very satisfied",
      }),
      single("Likelihood to recommend (0–10 style)", ["0–2", "3–4", "5–6", "7–8", "9–10"]),
      multi("What influenced your rating? (Select all that apply)", [
        "Staff helpfulness",
        "Product quality",
        "Wait time / speed",
        "Price / value",
        "Cleanliness",
        "Communication",
      ]),
      yesNo("Did you encounter any problems during your visit or purchase?"),
      longText("If you had a problem, please describe it."),
      scale("The issue was resolved to my satisfaction."),
      shortText("Staff member or location (optional)", { required: false }),
      longText("What one thing would improve your experience the most?"),
    ],
  },
  {
    id: "service-quality-check",
    topicId: "customer_satisfaction",
    title: "Service quality check",
    description: "Evaluate service delivery across key touchpoints.",
    category: "market",
    questions: [
      scale("Staff were courteous and professional."),
      scale("My request was handled in a reasonable time."),
      scale("Information provided was clear and accurate."),
      single("Channel used", ["In person", "Phone", "Email", "Website / app", "Social media"]),
      yesNo("Would you contact us again for similar needs?"),
      longText("Describe your best or worst moment during this interaction."),
    ],
  },
  {
    id: "student-course-feedback",
    topicId: "education_surveys",
    title: "Student course feedback",
    description: "Collect student feedback on course content, instruction, and materials.",
    category: "civic",
    questions: [
      scale("Course content was relevant and well organized."),
      scale("The instructor explained concepts clearly."),
      scale("Assignments and assessments were fair."),
      single("Course difficulty", ["Too easy", "About right", "Too difficult"]),
      multi("Which resources helped most? (Select all that apply)", ["Lectures", "Readings", "Videos", "Group work", "Practice exercises"]),
      yesNo("Would you recommend this course to other students?"),
      longText("What should be improved in this course?"),
    ],
  },
  {
    id: "parent-school-survey",
    topicId: "education_surveys",
    title: "Parent school satisfaction",
    description: "Gather parent views on school communication, safety, and learning outcomes.",
    category: "civic",
    questions: [
      scale("The school communicates effectively with parents."),
      scale("My child feels safe at school."),
      scale("Academic standards meet my expectations."),
      single("Child's grade level", ["Infant", "Primary", "High school", "Other"]),
      multi("Areas needing improvement (Select all that apply)", ["Facilities", "Discipline", "Extracurriculars", "Teacher quality", "Technology"]),
      yesNo("Would you recommend this school to other parents?"),
      longText("Additional comments for school leadership."),
    ],
  },
  {
    id: "employee-engagement-pulse",
    topicId: "employee_feedback",
    title: "Employee engagement pulse",
    description: "Short pulse on morale, management, and workplace culture.",
    category: "civic",
    questions: [
      scale("I feel valued for the work I do."),
      scale("I have the tools and resources to do my job well."),
      scale("Communication from leadership is clear."),
      single("Tenure with organization", ["Under 1 year", "1–3 years", "3–5 years", "Over 5 years"]),
      yesNo("I would recommend this organization as a good place to work."),
      multi("What would most improve your experience? (Select all that apply)", [
        "Pay & benefits",
        "Career growth",
        "Work-life balance",
        "Management support",
        "Training",
      ]),
      longText("What is working well that we should keep doing?"),
    ],
  },
  {
    id: "exit-interview-brief",
    topicId: "employee_feedback",
    title: "Exit interview (brief)",
    description: "Understand why employees leave and what could retain them.",
    category: "civic",
    questions: [
      single("Primary reason for leaving", ["New opportunity", "Compensation", "Management", "Relocation", "Personal reasons", "Other"]),
      scale("I felt supported during my time here."),
      scale("Onboarding prepared me for my role."),
      yesNo("Would you consider returning in the future?"),
      longText("What could the organization have done differently?"),
    ],
  },
  {
    id: "post-event-feedback",
    topicId: "event_planning_feedback",
    title: "Post-event feedback",
    description: "Evaluate event logistics, content, and overall attendee experience.",
    category: "civic",
    questions: [
      scale("Overall, the event met my expectations."),
      scale("Registration and check-in were smooth."),
      scale("Speakers / program content were valuable."),
      single("How did you hear about the event?", ["Email invite", "Social media", "Colleague", "Website", "Other"]),
      multi("Which aspects worked best? (Select all that apply)", ["Venue", "Food & refreshments", "Networking", "Materials", "Timing"]),
      yesNo("Would you attend a similar event again?"),
      single("Preferred future format", ["In person", "Virtual", "Hybrid"]),
      longText("Suggestions for the next event."),
    ],
  },
  {
    id: "event-planning-needs",
    topicId: "event_planning_feedback",
    title: "Event planning needs assessment",
    description: "Plan future events by understanding preferences and constraints.",
    category: "market",
    questions: [
      multi("Event types you would attend (Select all that apply)", ["Conference", "Workshop", "Networking mixer", "Community forum", "Training"]),
      single("Preferred day", ["Weekday", "Saturday", "Sunday", "No preference"]),
      dropdown("Preferred start time", ["Morning", "Afternoon", "Evening"]),
      scale("I am willing to travel within my district for events."),
      yesNo("Would you bring a colleague or guest?"),
      longText("Topics you want covered at future events."),
    ],
  },
  {
    id: "incident-report-follow-up",
    topicId: "incident_follow_up",
    title: "Incident report follow-up",
    description: "Follow up after a reported incident to assess resolution and safety.",
    category: "civic",
    questions: [
      yesNo("Were you contacted about your incident report?"),
      scale("Staff handled my report professionally."),
      scale("I feel the issue has been adequately addressed."),
      single("Incident type", ["Safety concern", "Service failure", "Policy violation", "Facility issue", "Other"]),
      yesNo("Do you feel safe continuing to use our services?"),
      longText("Describe any remaining concerns."),
    ],
  },
  {
    id: "tourism-operator-survey",
    topicId: "industry_specific",
    title: "Tourism operator survey",
    description: "Belize tourism industry attitudes, seasonality, and workforce needs.",
    category: "market",
    questions: [
      single("Business type", ["Hotel / resort", "Tour operator", "Restaurant", "Transport", "Craft / retail", "Other"]),
      scale("Tourism bookings have recovered since last year."),
      single("Biggest challenge right now", ["Staffing", "Costs", "Marketing", "Regulations", "Infrastructure", "Competition"]),
      yesNo("Are you hiring in the next 6 months?"),
      multi("Support needed from government or associations (Select all that apply)", [
        "Training grants",
        "Marketing support",
        "Access to finance",
        "Infrastructure",
        "Sustainable tourism guidance",
      ]),
      longText("What would most help your business thrive?"),
    ],
  },
  {
    id: "agriculture-panel-survey",
    topicId: "industry_specific",
    title: "Agriculture & fisheries panel",
    description: "Capture producer views on markets, climate, and extension services.",
    category: "market",
    questions: [
      single("Primary activity", ["Crop farming", "Livestock", "Fisheries", "Agro-processing", "Mixed"]),
      scale("Access to markets has improved in the past year."),
      scale("Extension services are available when needed."),
      yesNo("Have climate events affected your production recently?"),
      multi("Top priorities for support (Select all that apply)", ["Irrigation", "Inputs / feed", "Equipment", "Export access", "Training"]),
      longText("Describe the biggest opportunity for your sector."),
    ],
  },
  {
    id: "community-priorities-poll",
    topicId: "most_popular",
    title: "Community priorities poll",
    description: "Rank local issues and gauge support for public investments.",
    category: "political",
    questions: [
      multi("Top issues facing your community (Select up to 3)", [
        "Crime & safety",
        "Jobs & economy",
        "Roads & infrastructure",
        "Healthcare",
        "Education",
        "Environment",
      ]),
      scale("Local government is responsive to community needs."),
      single("Voting intention", ["Definitely will vote", "Probably will vote", "Not sure", "Probably will not vote"]),
      yesNo("Do you follow local news regularly?"),
      longText("What is the single most important issue for your household?"),
    ],
  },
  {
    id: "brand-awareness-tracker",
    topicId: "most_popular",
    title: "Brand awareness tracker",
    description: "Track awareness, consideration, and preference for a brand or organization.",
    category: "market",
    questions: [
      yesNo("Have you heard of this brand before today?"),
      multi("Where have you seen or heard about it? (Select all that apply)", ["TV / radio", "Social media", "Billboard", "Friend", "In store", "Online search"]),
      scale("I have a positive impression of this brand."),
      single("Likelihood to choose this brand next time", ["Very likely", "Somewhat likely", "Neutral", "Unlikely"]),
      longText("What words come to mind when you think of this brand?"),
    ],
  },
  {
    id: "membership-satisfaction",
    topicId: "nonprofit_membership",
    title: "Membership satisfaction",
    description: "Evaluate member satisfaction with programs, governance, and value.",
    category: "civic",
    questions: [
      scale("Membership provides good value for the fee paid."),
      scale("The organization is transparent about how funds are used."),
      single("Years as a member", ["Less than 1", "1–3", "3–5", "Over 5"]),
      yesNo("Have you attended a member meeting in the past year?"),
      multi("Programs you value most (Select all that apply)", ["Advocacy", "Community outreach", "Scholarships", "Events", "Publications"]),
      longText("How can we strengthen member engagement?"),
    ],
  },
  {
    id: "donor-intent-survey",
    topicId: "nonprofit_membership",
    title: "Donor intent survey",
    description: "Understand willingness to donate and preferred causes.",
    category: "civic",
    questions: [
      yesNo("Have you donated to a non-profit in the past 12 months?"),
      multi("Causes you support (Select all that apply)", ["Education", "Health", "Environment", "Youth", "Disaster relief", "Arts & culture"]),
      single("Preferred donation amount (BZ$)", ["Under 25", "25–100", "100–250", "250–500", "Over 500"]),
      scale("I trust organizations that publish impact reports."),
      longText("What would motivate you to donate more often?"),
    ],
  },
  {
    id: "publication-readership",
    topicId: "readership_satisfaction",
    title: "Publication readership survey",
    description: "Assess readership habits, content preferences, and subscription intent.",
    category: "market",
    questions: [
      single("How often do you read this publication?", ["Daily", "Weekly", "Monthly", "Rarely", "First time"]),
      multi("Preferred content types (Select all that apply)", ["News", "Opinion", "Investigations", "Sports", "Business", "Lifestyle"]),
      scale("Content quality meets my expectations."),
      yesNo("Would you pay for a digital subscription?"),
      single("Primary device for reading", ["Mobile phone", "Tablet", "Desktop", "Print"]),
      longText("Topics you want covered more often."),
    ],
  },
  {
    id: "retail-shopping-experience",
    topicId: "shopping_experience",
    title: "Retail shopping experience",
    description: "Evaluate in-store experience, product selection, and checkout.",
    category: "market",
    questions: [
      scale("The store was clean and well organized."),
      scale("Staff were available and helpful when needed."),
      scale("Checkout was quick and efficient."),
      single("Visit frequency", ["First visit", "Monthly", "Weekly", "Several times per week"]),
      multi("Departments shopped (Select all that apply)", ["Grocery", "Clothing", "Electronics", "Pharmacy", "Home goods"]),
      yesNo("Did you find everything you were looking for?"),
      longText("What would improve your next shopping trip?"),
    ],
  },
  {
    id: "online-shopping-feedback",
    topicId: "shopping_experience",
    title: "Online shopping feedback",
    description: "Measure e-commerce usability, delivery, and returns experience.",
    category: "market",
    questions: [
      scale("The website was easy to navigate."),
      scale("Product descriptions were accurate."),
      scale("Delivery arrived within the expected timeframe."),
      single("Payment method used", ["Credit / debit card", "Bank transfer", "Cash on delivery", "Mobile wallet"]),
      yesNo("Would you shop with this retailer again online?"),
      longText("What almost stopped you from completing your purchase?"),
    ],
  },
  {
    id: "new-product-concept-test",
    topicId: "product_testing",
    title: "New product concept test",
    description: "Test appeal, pricing, and messaging for a new product concept.",
    category: "market",
    questions: [
      scale("This concept sounds appealing to me."),
      single("Likelihood to try if available locally", ["Definitely", "Probably", "Not sure", "Probably not", "Definitely not"]),
      single("Expected price range (BZ$)", ["Too cheap to trust quality", "Good value", "Fair", "Too expensive"]),
      multi("Features that matter most (Select all that apply)", ["Quality", "Price", "Brand reputation", "Convenience", "Sustainability"]),
      yesNo("Would you switch from your current product?"),
      longText("What questions do you still have about this product?"),
    ],
  },
  {
    id: "service-beta-feedback",
    topicId: "product_testing",
    title: "Service beta feedback",
    description: "Collect structured feedback from beta testers of a new service.",
    category: "market",
    questions: [
      yesNo("Were you able to complete the main task without help?"),
      scale("The service was intuitive to use."),
      scale("Performance speed was acceptable."),
      multi("Issues encountered (Select all that apply)", ["Bugs / errors", "Confusing steps", "Missing features", "Login problems", "None"]),
      single("Would you use this after launch?", ["Yes, regularly", "Yes, occasionally", "Maybe", "No"]),
      longText("Describe the most frustrating moment during testing."),
    ],
  },
  {
    id: "website-usability",
    topicId: "website_feedback",
    title: "Website usability survey",
    description: "Evaluate navigation, content findability, and mobile experience.",
    category: "market",
    questions: [
      scale("I found what I was looking for easily."),
      scale("Pages loaded quickly on my device."),
      scale("The site works well on my phone."),
      single("Primary purpose of visit", ["Information", "Register / sign up", "Make a purchase", "Contact support", "Other"]),
      yesNo("Did you encounter broken links or errors?"),
      longText("What would make this website more useful?"),
    ],
  },
  {
    id: "website-content-feedback",
    topicId: "website_feedback",
    title: "Website content feedback",
    description: "Assess clarity, trust, and completeness of website content.",
    category: "market",
    questions: [
      scale("Content is clear and easy to understand."),
      scale("I trust the information on this site."),
      multi("Sections visited (Select all that apply)", ["Home", "About", "Services", "FAQ", "Contact", "Blog"]),
      yesNo("Did you find answers to your questions?"),
      single("How did you arrive at this site?", ["Search engine", "Direct link", "Social media", "Email", "Advertisement"]),
      longText("What content is missing or unclear?"),
    ],
  },
];

export function getSurveyTemplatesByTopic(topicId: SurveyTemplateTopicId): SurveyTemplate[] {
  return SURVEY_TEMPLATES.filter((template) => template.topicId === topicId);
}

export function findSurveyTemplateById(templateId: string): SurveyTemplate | undefined {
  return SURVEY_TEMPLATES.find((template) => template.id === templateId);
}

export function applySurveyTemplate(template: SurveyTemplate): {
  title: string;
  description: string;
  companyIntro: string;
  category: SurveyCategory;
  questions: SurveyQuestion[];
} {
  return {
    title: template.title,
    description: template.description,
    companyIntro: template.companyIntro ?? "",
    category: template.category,
    questions: instantiateTemplateQuestions(template.questions),
  };
}
