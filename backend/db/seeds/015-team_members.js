
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('team_members').del()
    .then(function () {
      // Inserts seed entries
      return knex('team_members').insert([
        {team_id: 1, user_id: 405, role: 'team_owner'},
        {team_id: 2, user_id: 405, role: 'team_owner'},
        {team_id: 1, user_id: 402, role: 'team_member'},
        {team_id: 2, user_id: 402, role: 'team_member'},
      ]);
    });
};
