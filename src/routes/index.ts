
import { lazy } from 'react';


const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));





// ORGANIZATION MANAGEMENT
const RegisterOrganization = lazy(() => import('../pages/CustomPages/OrganizationManagement/RegisterNewOrganization'));
const RemoveOrganization = lazy(() => import('../pages/CustomPages/OrganizationManagement/RemoveOrganization'));

const PendingApplications = lazy(() => import('../pages/CustomPages/ProfessionalManagement/PendingApplications'));


const DashboardForums = lazy(() => import('../pages/CustomPages/ForumsTrends'));  



//SUBSCRIPTION MANAGEMENT
const ViewAllSubscriptions = lazy(() => import('../pages/CustomPages/SubscriptionManagement/ViewAllSubscriptions'));
const ViewMySubscription = lazy(() => import('../pages/CustomPages/SubscriptionManagement/ViewMySubscription'));

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
const ViewForumReports = lazy(() => import('../pages/CustomPages/ForumManagement/ViewForumReports'));



const  BannedSuspendedUsers = lazy(() => import('../pages/CustomPages/BannedSuspendedUsers'));





const coreRoutes = [
 
    {
      path: '/forums/:forumId/posts/:postId',
      title: 'Post Details',
      component: PostDetailsPage,
  },
  {
    path: '/dashboardforums',
    title: 'Dashboard Forums',
    component: DashboardForums,
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
    path: '/forum-reports',
    title: 'Forum Reports',
    component: ViewForumReports,
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
  {
    path: '/my-subscription',
    title: 'My Subscription',
    component: ViewMySubscription,
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
    path:'/banned-suspended-users',
    title:'Banned Suspended Users',
    component:BannedSuspendedUsers
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
    path: '/pending-applications',
    title: 'Pending Applications',
    component: PendingApplications,
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
    path: '/profile/:authorId',
    title: 'Profile',
    component: Profile,
  },
 
 
  {
    path: '/settings',
    title: 'Settings',
    component: Settings,
  },
 
];

const routes = [...coreRoutes];
export default routes;
