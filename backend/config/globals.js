// Variables
const numOfFakeUsers = 400;
const numOfHashes = 10;
const numOfDiscussions = 29;
const numOfDefaultCategories = 7;
const numOfPosts = 59;
const numOfPostVotes = 400; // must be same as numOfFakeUsers
const numOfDiscussionVotes = 5000;
const tokenOptionExpiration = '24h';
const tokenTimeLeftRefresh = 3; // in hrs
const maxNumOfNotifications = 5;
const numOfReplies = 50;
const numOfReplyVotes = 500;

const categoryIcons = [
  'fas fa-book-open',
  'fas fa-scroll',
  'fas fa-map-marked-alt',
  'fas fa-comment',
  'fas fa-cog',
  'fas fa-bullhorn',
  'fas fa-archive',
  'fab fa-angular',
  'fas fa-pager',
  'fab fa-android',
  'fab fa-apple',
  'fas fa-atom',
  'fas fa-laptop',
  'fas fa-award',
  'fas fa-bell',
  'fas fa-chart-line',
  'fas fa-male',
  'fas fa-camera',
];

const allowedAvatarTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/bmp',
  'image/tiff'
];

// prettier-ignore
const safeUsrnameSqlLetters = [
  '-', '_', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
  'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
  'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
  'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ' ',
];

// prettier-ignore
const safePwdSqlLetters = [
  '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', 'a',
  'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
  'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A',
  'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1',
  '2', '3', '4', '5', '6', '7', '8', '9', '0'
];

const accountStatusTypes = ['inactive', 'active', 'banned']; // be careful when adding new things or changing order
const subscriptionPlans = ['free', 'silver', 'gold']; // same order as subscriptionPrices
// prettier-ignore
const accountUserTypes = ['user', 'silver_member', 'gold_member', 'admin']; // Must match with globals on front end
const subSilverStartIndex = 1; // Must match with globals on front end
// prettier-ignore
const permissionTypes = ['basic', accountUserTypes[0], accountUserTypes[1], accountUserTypes[2], accountUserTypes[3], 'super_moderator', 'moderator', accountUserTypes[accountUserTypes.length - 1]];
// prettier-ignore
const categoryPermissions = permissionTypes.slice();
// prettier-ignore
const discussionPermissions = permissionTypes.slice();
// prettier-ignore
const postPermissions = permissionTypes.slice();
// prettier-ignore
const votePermissions = permissionTypes.slice();
// prettier-ignore
const followPermissions = permissionTypes.slice();

// Methods
const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
};

const getRandomUserId = () => {
  min = 1;
  max = numOfFakeUsers;
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
};

const isUrl = (str, profileLink = false) => {
  /*if it is a profileLink meaning set to true check if str is null if it is return true. This will allow  for a user to reset their profile link to null
   this would also make sure that isUrl when used in other areas is not changed. 
  */
  if (profileLink === true && str.length === 0) return true; 
  var pattern = new RegExp('^((ft|htt)ps?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?' + // port
    '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
    '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return pattern.test(str);
}


// Seeds
// prettier-ignore
const categoryNames = ['Tech Talk', 'Sports', 'Cars', 'Anime', 'TV Shows', 'Movies', 'Music'];

// must match defaultAvatar on frontend globals
const defaultAvatar =
  'data:image/png;base64,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';

// environment variables
const secureKey = process.env.SECURE_KEY;
const frontEndUrl = process.env.FRONTEND_URL;
const nodeMailerHost = process.env.NODEMAILER_HOST;
const nodeMailerPort = process.env.NODEMAILER_PORT;
const nodeMailerUser = process.env.NODEMAILER_USER;
const nodeMailerPass = process.env.NODEMAILER_PASS;
const backendStripePkToken = process.env.BACKEND_STRIPE_TOKEN;
const pusherAppId = process.env.PUSHER_APP_ID;
const pusherKey = process.env.PUSHER_KEY;
const pusherSecret = process.env.PUSHER_SECRET;
const pusherCluster = process.env.PUSHER_CLUSTER;
const GClientEmail = process.env.GCLIENT_EMAIL;

const oAuthClientId = process.env.OAUTH_CLIENT_ID;
const oAuthClientSecret = process.env.OAUTH_CLIENT_SECRET; 
const oAuthRefreshToken = process.env.OAUTH_REFRESH_TOKEN;
const oAuthAccessToken = process.env.OAUTH_ACCESS_TOKEN; 
module.exports = {
  // variables
  subSilverStartIndex,
  numOfDiscussions,
  numOfDefaultCategories,
  numOfPosts,
  numOfFakeUsers,
  numOfHashes,
  numOfPostVotes,
  numOfDiscussionVotes,
  numOfReplies,
  numOfReplyVotes,
  maxNumOfNotifications,
  safeUsrnameSqlLetters,
  safePwdSqlLetters,
  accountStatusTypes,
  subscriptionPlans,
  accountUserTypes,
  tokenOptionExpiration,
  tokenTimeLeftRefresh,
  allowedAvatarTypes,
  categoryIcons,
  permissionTypes,

  // methods
  getRandomIntInclusive,
  getRandomUserId,
  isUrl,

  // seeds
  categoryNames,
  defaultAvatar,

  // environment variables
  secureKey,
  frontEndUrl,
  nodeMailerHost,
  nodeMailerPort,
  nodeMailerUser,
  nodeMailerPass,
  backendStripePkToken,
  pusherAppId,
  pusherKey,
  pusherSecret,
  pusherCluster,
  GClientEmail,

  //oAUTH USED WITH NODEMAILER 
  oAuthClientId,
  oAuthClientSecret,
  oAuthRefreshToken,
  oAuthAccessToken, 
};
