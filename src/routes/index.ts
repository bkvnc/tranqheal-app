
import { lazy } from 'react';

const Calendar = lazy(() => import('../pages/Calendar'));
const Chart = lazy(() => import('../pages/Chart'));
const FormElements = lazy(() => import('../pages/Form/FormElements'));
const FormLayout = lazy(() => import('../pages/Form/FormLayout'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const Alerts = lazy(() => import('../pages/UiElements/Alerts'));
const Buttons = lazy(() => import('../pages/UiElements/Buttons'));



const CallerFeedback = lazy(() => import('../pages/CustomPages/CallerFeedback'));
const CallerRating = lazy(() => import('../pages/CustomPages/CallerRating'));
const CallerConcerns = lazy(() => import('../pages/CustomPages/CallerConcerns'));
const ForumTrends = lazy(() => import('../pages/CustomPages/ForumsTrends'));
const LibraryTrends = lazy(() => import('../pages/CustomPages/LibraryTrends'));
const ResponderPerformance = lazy(() => import('../pages/CustomPages/ResponderPerformance'));

// ORGANIZATION MANAGEMENT
const RegisterOrganization = lazy(() => import('../pages/CustomPages/OrganizationManagement/RegisterNewOrganization'));
const RemoveOrganization = lazy(() => import('../pages/CustomPages/OrganizationManagement/RemoveOrganization'));
const ViewAllOrganizations = lazy(() => import('../pages/CustomPages/OrganizationManagement/ViewAllOrganizations'));
const PendingApplications = lazy(() => import('../pages/CustomPages/ProfessionalManagement/PendingApplications'));

// LIBRARY MANAGEMENT
const ViewAllResources = lazy(() => import('../pages/CustomPages/LibraryManagement/ViewAllResources'));
const AddResources = lazy(() => import('../pages/CustomPages/LibraryManagement/AddResource'));


// LATEST CALLS
const LatestCalls = lazy(() => import('../pages/CustomPages/ListCalls'));


//SUBSCRIPTION MANAGEMENT
const ViewAllSubscriptions = lazy(() => import('../pages/CustomPages/SubscriptionManagement/ViewAllSubscriptions'));
//const ViewSubscriptionComponent = lazy(() => import('../pages/CustomPages/SubscriptionManagement/ViewSubscriptionComponent'));
const CheckoutPage = lazy(() => import('../pages/CustomPages/SubscriptionManagement/CheckoutPage'));
const CheckoutSuccess = lazy(() => import('../pages/CustomPages/SubscriptionManagement/CheckoutSuccess'));
const CheckoutFailed = lazy(() => import('../pages/CustomPages/SubscriptionManagement/CheckoutFailed'));


const subscriptionPlans = lazy(() => import('../pages/CustomPages/SubscriptionManagement/subscriptionPlan'));

//User Management
const ViewAllUsers = lazy(() => import('../pages/CustomPages/UserManagement/ViewAllUsers'));


//PROFESSIONAL MANAGEMENT
const RemoveProfessional = lazy(() => import('../pages/CustomPages/ProfessionalManagement/RemoveProfessional'));

//FORUM MANAGEMENT
 const BlacklistedWords = lazy(() => import('../pages/CustomPages/ForumManagement/BlackListedWords'));
 const ManageForum = lazy(() => import('../pages/CustomPages/ForumManagement/ManageForum'));
 const MyForum = lazy(() => import('../pages/CustomPages/ForumManagement/MyForum'));
const ForumDetails = lazy(() => import('../pages/CustomPages/ForumManagement/ForumDetails'));
const PostDetailsPage = lazy(() => import('../pages/CustomPages/ForumManagement/PostDetailsPage'));
const ViewUserProfile = lazy(() => import('../pages/CustomPages/UserManagement/UserProfilePage'));
const ViewPendingPosts = lazy(() => import('../pages/CustomPages/ForumManagement/ViewPendingPosts'));



const coreRoutes = [
  {
    path: '/calls',
    title: 'calls',
    component: LatestCalls,
  },
    {
      path: '/forums/:forumId/posts/:postId',
      title: 'Post Details',
      component: PostDetailsPage,
  },
  {
    path: '/users/:userId',
    title: 'View User Profile',
    component: ViewUserProfile,
  },
  {
    path: '/pending-posts',
    title: 'Pending Posts',
    component: ViewPendingPosts,
  },
  {
    path: '/forums/:forumId',
    title: 'Forum Details',
    component: ForumDetails,
  },
  {
    path: '/myforum',
    title: 'myforum',
    component: MyForum,

  },
  {
    path: '/manage-forum',
    title: 'Manage Forum',
    component: ManageForum,
  },
  {
    path: '/blacklisted-words',
    title: 'Blacklisted Words',
    component: BlacklistedWords,
  },
  {
    path: '/remove-professional',
    title: 'Mental Health Professionals',
    component: RemoveProfessional,
  },
  {
    path: '/subscriptions',
    title: 'Subscriptions',
    component: ViewAllSubscriptions,
  },
  // {
  //   path: '/subscriptionComponent',
  //   title: 'Subscription Component',
  //   component: ViewSubscriptionComponent,
  // },
  {
    path: '/subscription-plans',
    title: 'Subscription Plans',
    component: subscriptionPlans,
  },
  {
    path: '/users',
    title: '/users',
    component: ViewAllUsers,
  },
  {
    path: '/checkout/:planId',
    title: 'Checkout',
    component: CheckoutPage,
  },
  {
    path: '/subscription/success',
    title: 'Checkout Success',
    component: CheckoutSuccess,
  },
  {
    path: '/subscription/failed',
    title: 'Checkout Failed',
    component: CheckoutFailed,
  },
  {
    path: '/add-resources',
    title: 'Resource Library',
    component: AddResources,
  },
  {
    path: '/view-resources',
    title: 'Resource Library',
    component: ViewAllResources,
  },
  {
    path: '/pending-applications',
    title: 'Pending Applications',
    component: PendingApplications,
  },
  {
    path: '/view-organizations',
    title: 'View All Mental Health Organizations',
    component: ViewAllOrganizations,
  },
  {
    path: '/remove-organization',
    title: 'Remove Organization',
    component: RemoveOrganization,
  },
  {
    path: '/register-organization',
    title: 'Register Mental Health Organization',
    component: RegisterOrganization,
  },
  {
    path: '/performance',
    title: 'Hotline Responder Performance',
    component: ResponderPerformance,
  },
  {
    path: '/library',
    title: 'Resource Library Trends',
    component: LibraryTrends,
  },
  {
    path: '/dashboardforums',
    title: 'Forum Trends',
    component: ForumTrends,
  },
  {
    path: '/concerns',
    title: 'Caller Concerns',
    component: CallerConcerns,
  },
  {
    path: '/rating',
    title: 'Caller Rating',
    component: CallerRating,
  },
  {
    path: '/feedback',
    title: 'Caller Feedback',
    component: CallerFeedback,
  },
  {
    path: '/calendar',
    title: 'Calender',
    component: Calendar,
  },
  {
    path: '/profile/:authorId',
    title: 'Profile',
    component: Profile,
  },
 
  {
    path: '/forms/form-elements',
    title: 'Forms Elements',
    component: FormElements,
  },
  {
    path: '/forms/form-layout',
    title: 'Form Layouts',
    component: FormLayout,
  },
  {
    path: '/settings',
    title: 'Settings',
    component: Settings,
  },
  {
    path: '/chart',
    title: 'Chart',
    component: Chart,
  },
  {
    path: '/ui/alerts',
    title: 'Alerts',
    component: Alerts,
  },
  {
    path: '/ui/buttons',
    title: 'Buttons',
    component: Buttons,
  },
];

const routes = [...coreRoutes];
export default routes;
