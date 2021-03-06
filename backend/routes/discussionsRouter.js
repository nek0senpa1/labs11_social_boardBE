/***************************************************************************************************
 ******************************************* dependencies ******************************************
 **************************************************************************************************/
require('dotenv').config();
const express = require('express');
const { discussionsDB, userNotificationsDB, categoryFollowsDB, userFollowersDB, teamMembersDB } = require('../db/models/index.js');

const router = express.Router();

const { maxNumOfNotifications } = require('../config/globals.js');
const pusher = require('../config/pusherConfig.js');

/***************************************************************************************************
 ******************************************** middleware ********************************************
 **************************************************************************************************/
const { authenticate } = require('../config/middleware/authenticate.js');
const { checkRole } = require('../config/middleware/helpers.js');

//Used to make sure a user will get one notification and one notification only. 
const getUniqueFollowers = (array1, array2, userId) => {
  /*array1 and array2 are arrays of user id and uuid   userId will be used to filter out the user final array returned shouldn't feature the 
   userId because this would be the user that is making the discussion/post. They don't need to be alerted having already created the post. */
   const keepIds = {}; //keeps track of userIds that have already been 
   //instead of using an Array using a hash table/ Object allos for search complexity to occur in O(1)
   const finalFollows = []; 
   const combinedFollows = [...array1, ...array2];
   for(let user of combinedFollows){
     if(Number(user.user_id) !== Number(userId)){
       if(!(user.user_id in keepIds)){
         keepIds[user.user_id] = user.uuid; 
         const temp = {user_id : user.user_id, uuid : user.uuid};
         finalFollows.push(temp);
       }
     }
   }
   return finalFollows; 
}

/***************************************************************************************************
 ********************************************* Endpoints *******************************************
 **************************************************************************************************/



// get top (limit 10) daily discussions ordered by vote_count
// router.get('/top-daily/:user_id', authenticate, (req, res) => {
//   const order = req.get('order');
//   const orderType = req.get('orderType');
//   let { user_id } = req.params;
//   if (user_id === 'null') user_id = 0;
//   return discussionsDB
//     .getTopDailyDiscussions(user_id, order, orderType)
//     .then(topDailyDiscussions => res.status(200).json(topDailyDiscussions))
//     .catch(err => res.status(500).json({ error: `Failed to getTopDailyDiscussions(): ${err}` }));
// });

//GET All Discussions
router.get('/', (req, res) => {
  return discussionsDB
    .getDiscussions()
    .then(discussMap => res.status(200).json(discussMap))
    .catch(err => res.status(500).json({ error: `Failed to getDiscussions(): ${err}` }));
});

router.get('/all-by-followed-categories/:user_id', authenticate, (req, res) => {
  const { user_id } = req.params;
  return discussionsDB.getAllDiscussionsByFollowedCategories(user_id)
    .then(discussions => res.status(200).json(discussions))
    .catch(err => res.status(500).json({ error: `Failed to getAllDiscussionsByFollowedCategories(): ${err}` }));
});

//GET Discussion by Discussion ID
router.get('/discussion/:id/:user_id', authenticate, async (req, res) => {
  const order = req.get('order');
  const orderType = req.get('orderType');
  const { id } = req.params;
  let { user_id } = req.params;
  if (user_id === 'null') user_id = 0;
  await discussionsDB.addViewToDiscussion(id);
  return discussionsDB
    .findById(id, user_id, order, orderType)
    .then(discussion => res.status(200).json(discussion))
    .catch(err => res.status(500).json({ error: `Failed to findById(): ${err}` }));
});

router.get('/search', (req, res) => {
  const searchText = req.get('searchText');
  let order = req.get('order');
  let orderType = req.get('orderType');
  if (order === 'undefined') order = null;
  if (orderType === 'undefined') orderType = null;
  if (!searchText) return res.status(200).json([]);
  return discussionsDB.search(searchText, order, orderType)
    .then(results =>{
      const newRes = results.filter(res => res.isPrivate !== true);
      res.status(200).json(newRes)
    })
    .catch(err => {console.log(err);res.status(500).json({ error: `Failed to search(): ${err}` })});
});

//GET Discussion by User ID (Super-Mod/Creator)
router.get('/user/:user_id', (req, res) => {
  const { user_id } = req.params;
  return discussionsDB
    .findByUserId(user_id)
    .then(discussMap => res.status(200).json(discussMap))
    .catch(err =>
      res.status(500).json({ error: `Failed to findByUserId(): ${err}` })
    );
});

//GET Discussion by Category ID
router.get('/category/:category_id/:user_id', authenticate, (req, res) => {
  const order = req.get('order');
  const orderType = req.get('orderType');
  const { category_id } = req.params;
  let { user_id } = req.params;
  if (user_id === 'null') user_id = 0;
  return discussionsDB
    .findByCategoryId(category_id, user_id, order, orderType)
    .then(discussMap => res.status(200).json(discussMap))
    .catch(err => res.status(500).json({ error: `Failed to findByCategoryId(): ${err}` }));
});

//Add Discussion
router.post('/:user_id', authenticate, checkRole, async (req, res) => {
  const { user_id } = req.params;
  const { dBody, category_id, team_id } = req.body;
  const created_at = Date.now();
  if (!dBody) return res.status(400).json({ error: 'discussion body must not be empty.' });
  const newDiscussion = { user_id, category_id, team_id, body: dBody, created_at };
  
  if(newDiscussion.category_id){
    return discussionsDB
    .insert(newDiscussion)
    .then(async newId => {
      const catFollowers = await categoryFollowsDB.getFollowers(category_id);
      const usersFollowing = await userFollowersDB.getUsersFollowingUser(user_id);
      const alreadySent = {}; 
      // const finalFollowers = await getUniqueFollowers(catFollowers, usersFollowing, user_id);
        // finalFollowers.forEach(async user => {

      catFollowers.forEach(async user => {
        const newNotification = { user_id: user.user_id, category_id, discussion_id: newId[0], created_at };
        const notifications = await userNotificationsDB.getCount(user.user_id);
        if (parseInt(notifications.count) >= maxNumOfNotifications) {
          await userNotificationsDB.removeOldest(user.user_id);
        }
        await userNotificationsDB.add(newNotification);
        alreadySent[user.user_id] = category_id; 
        if(user_id != user.user_id){
          pusher.trigger(
            `user-${user.uuid}`,
            'notification',
            null,
          );
        }
      });

      usersFollowing.forEach(async user => {
        const newNotification = { user_id: user.user_id, category_id, discussion_id: newId[0], created_at };
        const notifications = await userNotificationsDB.getCount(user.user_id);
        if (parseInt(notifications.count) >= maxNumOfNotifications) {
          await userNotificationsDB.removeOldest(user.user_id);
        }

        await userNotificationsDB.add(newNotification);
        if(!(user.user_id in alreadySent && user_id != user.user_id)){
          pusher.trigger(
            `user-${user.uuid}`,
            'notification',
            null,
          );
        }
      }); 
      
      return res.status(201).json(newId);
    })
    .catch(err => res.status(500).json({ error: `Failed to insert(): ${err}` }));
  } else {
    try {
      
      const discussion = await discussionsDB.insert(newDiscussion);
      const team_members = await teamMembersDB.getTeamMembers(newDiscussion.team_id);
        team_members.forEach( async mem => {
          const newNotification = { user_id: mem.user_id, team_id, discussion_id: discussion[0], created_at };
          const notifications = await userNotificationsDB.getCount(mem.user_id);
          if (parseInt(notifications.count) >= maxNumOfNotifications) {
            await userNotificationsDB.removeOldest(mem.user_id);
          }
          await userNotificationsDB.add(newNotification);
          pusher.trigger(
            `user-${mem.uuid}`,
            'notification',
            null,
          );
        })

      res.status(201).json(discussion);
    } catch(err){
      res.status(500).json({ error: `failed to insert(): ${err}` });
    }
  }
});

// edit post with given post id
router.put('/:user_id', authenticate, (req, res) => {
  const { discussion_id, dBody } = req.body;
  const last_edited_at = Date.now();
  const discussion = { body: dBody, last_edited_at };
  if (!dBody) return res.status(400).json({ error: 'Discussion body must not be empty.' });
  if (!discussion_id) return res.status(400).json({ error: 'Discussion ID is required.' });
  return discussionsDB
    .update(discussion_id, discussion)
    .then(() => res.status(201).json({ message: 'Discussion update successful.' }))
    .catch(err => res.status(500).json({ error: `Failed to update(): ${err}` }));
});

//Delete Discussion
router.delete('/:user_id', authenticate, (req, res) => {
  const discussion_id = req.get('discussion_id');
  if (!discussion_id) return res.status(400).json({ error: 'Discussion ID is required.' });
  return discussionsDB
    .remove(discussion_id)
    .then(() => res.status(201).json({ message: 'Discussion removal successful.' }))
    .catch(err => res.status(500).json({ error: `Failed to remove(): ${err}` }));
});

module.exports = router;
