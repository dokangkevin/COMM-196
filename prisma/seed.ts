import { PrismaClient, OnboardingState, PublicationStatus, StaffRole, ApprovalStatus, ReviewStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const inDays = (days: number) => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + days); return date; };

const clubs = [
  ["finance-association","Pacific Finance Association","Business",["finance","investing","careers","markets"],["Sauder","Economics"],5],
  ["consulting-society","Campus Consulting Society","Business",["consulting","strategy","case competitions","leadership"],["Sauder","Arts","Engineering"],6],
  ["entrepreneurship-network","Venture Builders Network","Business",["entrepreneurship","startups","product","networking"],["Sauder","Engineering","Science"],4],
  ["marketing-strategy","Marketing & Brand Lab","Business",["marketing","strategy","design","communications"],["Sauder","Arts"],4],
  ["premed-society","Pre-Med Pathways Society","Science & Health",["medicine","health","mentorship","volunteering"],["Science","Kinesiology","Arts"],3],
  ["global-health","Global Health Collective","Science & Health",["health","global health","equity","community"],["Science","Arts","Medicine"],4],
  ["research-network","Undergraduate Research Network","Science & Health",["research","science","technology","academia"],["Science","Engineering","Arts"],3],
  ["ai-coding","AI & Coding Club","Technology",["technology","artificial intelligence","coding","product"],["Science","Engineering","Sauder"],6],
  ["robotics-society","Robotics & Engineering Society","Technology",["robotics","engineering","technology","hardware"],["Engineering","Science"],8],
  ["game-dev","Game Development Collective","Technology",["games","coding","design","art"],["Science","Arts","Engineering"],5],
  ["photography-society","Campus Photography Society","Arts & Creativity",["photography","art","design","storytelling"],["Arts","All Faculties"],3],
  ["film-media-club","Film & Media Club","Arts & Creativity",["film","media","writing","production"],["Arts","All Faculties"],4],
  ["music-production","Music Production Collective","Arts & Creativity",["music","production","audio","creativity"],["Arts","All Faculties"],3],
  ["international-network","International Students Network","Culture & Community",["international relations","community","culture","mentorship"],["All Faculties"],2],
  ["cultural-exchange","Cultural Exchange Society","Culture & Community",["culture","languages","community","international relations"],["All Faculties"],2],
  ["sustainability-collective","Sustainability Collective","Environment & Service",["sustainability","climate","volunteering","policy"],["Land & Food Systems","Science","Arts"],5],
  ["volunteer-action","Volunteer Action Network","Environment & Service",["volunteering","community","social impact","leadership"],["All Faculties"],3],
  ["model-un","Model United Nations Society","Politics & Speaking",["international relations","public speaking","policy","diplomacy"],["Arts","Sauder"],6],
  ["debate-society","Debate & Public Speaking Club","Politics & Speaking",["public speaking","debate","communication","leadership"],["All Faculties"],3],
  ["badminton-club","Campus Badminton Club","Sports & Recreation",["badminton","sports","wellness","community"],["All Faculties"],3],
  ["outdoor-adventure","Outdoor Adventure Club","Sports & Recreation",["outdoors","hiking","wellness","sustainability"],["All Faculties"],6]
] as const;

const opportunitySeeds = [
  ["finance-association","Junior Analyst Team",-10,4], ["consulting-society","Community Consultant",-8,2],
  ["entrepreneurship-network","Venture Studio Associate",3,14], ["premed-society","Peer Programs Coordinator",-12,6],
  ["research-network","Research Peer Mentor",2,12], ["ai-coding","Project Team Developer",-9,3],
  ["robotics-society","Controls Team Trainee",4,18], ["photography-society","Exhibition Curator",-20,-3],
  ["film-media-club","Short Film Crew",-16,-1], ["international-network","Welcome Team Volunteer",1,10],
  ["sustainability-collective","Circular Campus Lead",-7,5], ["volunteer-action","Community Project Captain",5,19],
  ["debate-society","Tournament Operations Team",-5,1]
] as const;

const personas = [
  ["alex","Alex Chen","Sauder","Commerce",2,["consulting","finance","entrepreneurship","strategy"],6],
  ["maya","Maya Patel","Science","Integrated Sciences",3,["medicine","research","technology","health"],5],
  ["jordan","Jordan Lee","Arts","Film Studies",2,["photography","film","music","design"],4],
  ["sam","Sam Rivera","Arts","International Relations",4,["sustainability","volunteering","international relations","public speaking"],7]
] as const;

async function main() {
  for (const [slug,name,category,tags,faculties,hours] of clubs) {
    const club = await prisma.club.upsert({ where:{slug}, update:{name,category,tags:[...tags],academicRelevance:[...faculties],expectedHoursPerWeek:hours}, create:{slug,name,category,tags:[...tags],academicRelevance:[...faculties],expectedHoursPerWeek:hours,description:`A representative student community for ${tags.slice(0,2).join(" and ")}.`,mission:"Create a welcoming place to learn, contribute, and connect.",membershipInformation:"See club profile for representative membership details.",activities:["Workshops","Community events","Peer learning"]} });
    await prisma.clubEvent.deleteMany({where:{clubId:club.id,title:`${name} Community Night`}});
    await prisma.clubEvent.create({data:{clubId:club.id,title:`${name} Community Night`,description:"Meet members and experience a representative club activity.",eventType:"CLUB_EVENT",startsAt:inDays(7 + clubs.findIndex(item => item[0] === slug)),endsAt:inDays(7 + clubs.findIndex(item => item[0] === slug))}});
  }
  for (const [slug,title,open,deadline] of opportunitySeeds) {
    const club = await prisma.club.findUniqueOrThrow({where:{slug}});
    await prisma.recruitmentOpportunity.deleteMany({where:{clubId:club.id,title}});
    await prisma.recruitmentOpportunity.create({data:{clubId:club.id,title,description:`Join the ${title} team for a practical, collaborative term.`,requirements:"Open to students from all faculties unless otherwise noted.",applicationOpens:inDays(open),applicationDeadline:inDays(deadline),publicationStatus:PublicationStatus.PUBLISHED}});
  }
  for (const [id,name,faculty,major,academicYear,interests,hours] of personas) {
    await prisma.user.upsert({where:{id},update:{displayName:name},create:{id,displayName:name}});
    await prisma.studentProfile.upsert({where:{userId:id},update:{faculty,major,academicYear,interests:[...interests],preferredHoursPerWeek:hours,onboardingState:OnboardingState.COMPLETE},create:{id:`profile-${id}`,userId:id,faculty,major,academicYear,interests:[...interests],preferredHoursPerWeek:hours,onboardingState:OnboardingState.COMPLETE}});
  }
  const initialSaves = [["alex","consulting-society"],["maya","research-network"],["jordan","film-media-club"],["sam","sustainability-collective"]] as const;
  for (const [persona,slug] of initialSaves) {
    const club = await prisma.club.findUniqueOrThrow({where:{slug}});
    await prisma.savedClub.upsert({where:{studentId_clubId:{studentId:`profile-${persona}`,clubId:club.id}},update:{},create:{studentId:`profile-${persona}`,clubId:club.id}});
  }

  await prisma.user.upsert({ where: { id: "staffdemo" }, update: { displayName: "ClubHub Staff Demo" }, create: { id: "staffdemo", displayName: "ClubHub Staff Demo" } });
  const financeClub = await prisma.club.findUniqueOrThrow({ where: { slug: "finance-association" } });
  const consultingClub = await prisma.club.findUniqueOrThrow({ where: { slug: "consulting-society" } });
  const sustainabilityClub = await prisma.club.findUniqueOrThrow({ where: { slug: "sustainability-collective" } });
  for (const membership of [
    { userId: "staffdemo", clubId: financeClub.id, role: StaffRole.OWNER },
    { userId: "alex", clubId: consultingClub.id, role: StaffRole.OWNER },
    { userId: "maya", clubId: consultingClub.id, role: StaffRole.REVIEWER },
    { userId: "sam", clubId: sustainabilityClub.id, role: StaffRole.OWNER },
    { userId: "jordan", clubId: sustainabilityClub.id, role: StaffRole.EDITOR },
  ]) {
    await prisma.clubStaffMembership.upsert({ where: { userId_clubId: { userId: membership.userId, clubId: membership.clubId } }, update: { role: membership.role, status: ApprovalStatus.APPROVED }, create: { ...membership, status: ApprovalStatus.APPROVED } });
  }

  const demoQuestionSchema = [
    { id: "motivation", title: "Why are you interested in joining our club?", type: "LONG_TEXT", required: true, limit: 200, limitType: "words", options: [] },
    { id: "year", title: "What year of study are you in?", type: "MULTIPLE_CHOICE", required: true, options: ["First", "Second", "Third", "Fourth or above"] },
    { id: "experience", title: "What relevant experiences do you have?", type: "LONG_TEXT", required: false, limit: 150, limitType: "words", options: [] },
  ];
  const formTargets = [
    ["finance-association", "Junior Analyst Team", "Junior Analyst Application"],
    ["consulting-society", "Community Consultant", "Community Consultant Application"],
    ["sustainability-collective", "Circular Campus Lead", "Circular Campus Lead Application"],
  ] as const;
  for (const [slug, title, name] of formTargets) {
    const opportunity = await prisma.recruitmentOpportunity.findFirstOrThrow({ where: { club: { slug }, title } });
    await prisma.applicationForm.upsert({ where: { opportunityId_version: { opportunityId: opportunity.id, version: 1 } }, update: { name, schema: demoQuestionSchema, publicationStatus: PublicationStatus.PUBLISHED }, create: { opportunityId: opportunity.id, version: 1, name, schema: demoQuestionSchema, publicationStatus: PublicationStatus.PUBLISHED, publishedAt: new Date() } });
  }

  const financeOpportunity = await prisma.recruitmentOpportunity.findFirstOrThrow({ where: { clubId: financeClub.id, title: "Junior Analyst Team" } });
  const financeForm = await prisma.applicationForm.findUniqueOrThrow({ where: { opportunityId_version: { opportunityId: financeOpportunity.id, version: 1 } } });
  for (const applicant of ["sam", "jordan"] as const) {
    const submission = await prisma.applicationSubmission.upsert({ where: { applicantId_opportunityId: { applicantId: `profile-${applicant}`, opportunityId: financeOpportunity.id } }, update: {}, create: { applicantId: `profile-${applicant}`, opportunityId: financeOpportunity.id, formId: financeForm.id, formVersion: 1, reviewStatus: applicant === "jordan" ? ReviewStatus.INTERVIEW : ReviewStatus.SUBMITTED } });
    await prisma.applicationAnswer.upsert({ where: { submissionId_questionRef: { submissionId: submission.id, questionRef: "motivation" } }, update: {}, create: { submissionId: submission.id, questionRef: "motivation", value: applicant === "jordan" ? "I am interested in how narrative and market evidence combine in investment decisions." : "I want to connect financial analysis with projects that create measurable community value." } });
  }
}

main().finally(() => prisma.$disconnect());
