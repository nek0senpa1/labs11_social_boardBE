const db = require('../dbConfig.js');

const search = (searchText, order, orderType) => {
  return db('posts as p')
    .select(
      'p.id',
      'p.discussion_id',
      'p.created_at',
      'p.body',
      'p.user_id',
      'u.username',
      'c.id as category_id',
      'c.name as category_name',
      'd.body as discussion_body',
      't.id as team_id',
      't.team_name',
      't.isPrivate',
      db.raw('SUM(COALESCE(pv.type, 0)) AS votes'),
    )
    .leftOuterJoin('post_votes as pv', 'pv.post_id', 'p.id')
    .leftOuterJoin('users as u', 'u.id', 'p.user_id')
    .join('discussions as d', 'd.id', 'p.discussion_id')
    .leftOuterJoin('categories as c', 'c.id', 'd.category_id')
    .leftOuterJoin('teams as t', 't.id', 'd.team_id')
    .whereRaw('LOWER(p.body) LIKE ?', `%${searchText.toLowerCase()}%`)
    .groupBy('p.id', 'u.username', 'c.name', 'c.id', 'd.body', 't.id', 't.isPrivate')
    // order by given order and orderType, else default to ordering by created_at descending
    .orderBy(`${order ? order : 'p.created_at'}`, `${orderType ? orderType : 'desc'}`);
};

// get the user_id and discussion_id related to the post with the given id
const getDiscAndUserInfoFromPostID = id => {
  return db('posts as p')
    .select('p.user_id', 'p.discussion_id', 'u.uuid')
    .leftOuterJoin('users as u', 'u.id', '=', 'p.user_id')
    .where('p.id', id)
    .first();
};

// create a post by a given user_id to a given discussion_id
const insert = newPost => {
  return db('posts').insert(newPost).returning('id');
};

// edit post with given post id
const update = (id, post) => {
  return db('posts').where({ id }).update(post);
};

// remove post with given post id
const remove = (id) => {
  // insertDeletedPost(id, post)
  return db('posts').where({ id }).del();
};

const insertDeletedPost = (user_id, postBody, post_id) => {
  return db('deleted_post')
    .insert({ "post": postBody[0], 'user_id': user_id, 'post_id': post_id[0] })
}

const getDeletedPost = () => {
  return db('deleted_post as dp')
    .select('dp.id', 'dp.post', 'dp.post_id', 'u.username')
    .join('users as u', 'u.id', 'dp.user_id')
}

const addImage = async post_image => {
  const [id] = await db('post_images').insert(post_image, 'id');

  return db('post_images')
    .where({ id })
    .first();
};

const deleteImage = id => {
  return db('post_images')
    .where({ id })
    .del();
};

const getPostImagesByPostId = post_id => {
  return db('post_images')
    .where({ post_id });
}

const updateImageWithPost = (id, post_id) => {
  return db('post_images')
    .update({ post_id })
    .where({ id })
};

const updateImageWithReply = (id, replies_id) => {
  return db('post_images')
    .update({ replies_id })
    .where({ id })
};

const updateImageWithDiscussion = (id, discussion_id) => {
  return db('post_images')
    .update({ discussion_id })
    .where({ id })
};

module.exports = {
  search,
  getDiscAndUserInfoFromPostID,
  insert,
  update,
  remove,
  addImage,
  getPostImagesByPostId,
  deleteImage,
  updateImageWithPost,
  updateImageWithReply,
  updateImageWithDiscussion,
  getDeletedPost,
  insertDeletedPost
};
