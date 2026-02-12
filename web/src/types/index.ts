export interface User {
  id: string
  email: string
  role: 'FREELANCER' | 'EMPLOYER' | 'HYBRID' | 'ADMIN'
  status: string
  profile: Profile
  skills?: UserSkill[]
  experiences?: Experience[]
  educations?: Education[]
  certifications?: Certification[]
  portfolioItems?: PortfolioItem[]
}

export interface Profile {
  id: string
  firstName: string
  lastName: string
  displayName?: string
  headline?: string
  bio?: string
  avatarUrl?: string
  bannerUrl?: string
  location?: string
  timezone?: string
  hourlyRate?: number
  availability: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'NOT_AVAILABLE' | 'OPEN_TO_OFFERS'
  githubUsername?: string
  linkedinUrl?: string
  websiteUrl?: string
  totalEarnings: number
  totalSpent: number
  completedJobs: number
  successRate: number
  avgRating: number
  totalReviews: number
  isVerified: boolean
}

export interface UserSkill {
  id: string
  skill: Skill
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  yearsOfExp: number
  endorsementCount: number
}

export interface Skill {
  id: string
  name: string
  slug: string
  category?: string
}

export interface Experience {
  id: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  description?: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  field?: string
  startDate: string
  endDate?: string
}

export interface Certification {
  id: string
  name: string
  issuingOrg: string
  issueDate: string
  expiryDate?: string
  credentialUrl?: string
}

export interface PortfolioItem {
  id: string
  title: string
  description?: string
  projectUrl?: string
  imageUrls: string[]
  tags: string[]
}

export interface Job {
  id: string
  title: string
  description: string
  category: string
  subcategory?: string
  jobType: 'FIXED_PRICE' | 'HOURLY' | 'MILESTONE' | 'BIDDING'
  experienceLevel: 'ENTRY' | 'INTERMEDIATE' | 'EXPERT'
  budgetType: 'FIXED' | 'HOURLY' | 'RANGE'
  budgetMin?: number
  budgetMax?: number
  fixedPrice?: number
  deadline?: string
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  isRemote: boolean
  proposalCount: number
  viewCount: number
  createdAt: string
  poster: User
  skills: { skill: Skill }[]
}

export interface Proposal {
  id: string
  coverLetter: string
  bidAmount: number
  estimatedDuration?: string
  status: 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  submittedAt: string
  job: Job
  freelancer: User
  milestones: ProposedMilestone[]
}

export interface ProposedMilestone {
  id: string
  title: string
  description?: string
  amount: number
  duration?: string
  order: number
}

export interface Contract {
  id: string
  title: string
  description?: string
  totalAmount: number
  paidAmount: number
  contractType: 'FIXED_PRICE' | 'HOURLY' | 'MILESTONE'
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
  startDate: string
  endDate?: string
  job: Job
  client: User
  freelancer: User
  milestones: Milestone[]
  escrow?: Escrow
}

export interface Milestone {
  id: string
  title: string
  description?: string
  amount: number
  dueDate?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'PAID'
  order: number
}

export interface Escrow {
  id: string
  totalAmount: number
  heldAmount: number
  releasedAmount: number
  status: string
}

export interface Conversation {
  id: string
  type: 'DIRECT' | 'PROJECT' | 'GROUP'
  title?: string
  participants: { user: User }[]
  messages?: Message[]
  contract?: Contract
  updatedAt: string
}

export interface Message {
  id: string
  content: string
  messageType: 'TEXT' | 'FILE' | 'IMAGE' | 'CODE'
  attachments: string[]
  createdAt: string
  sender: User
}

export interface Product {
  id: string
  title: string
  slug: string
  description: string
  shortDesc?: string
  category: string
  price: number
  salePrice?: number
  thumbnailUrl?: string
  imageUrls: string[]
  status: 'DRAFT' | 'PUBLISHED'
  salesCount: number
  avgRating: number
  reviewCount: number
  seller: User
}

export interface Post {
  id: string
  content: string
  imageUrls: string[]
  linkUrl?: string
  postType: 'UPDATE' | 'PROJECT_LAUNCH' | 'HIRING' | 'ACHIEVEMENT'
  likeCount: number
  commentCount: number
  createdAt: string
  author: User
  isLiked?: boolean
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}
