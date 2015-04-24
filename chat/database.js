var pg = require('pg');

var connString = process.env.CONN_STRING || "postgres://postgres:postgres@localhost/chat-app_development"

var sql = require('sql');
sql.setDialect('postgres');


var user = sql.define({
  name: 'users',
  columns: ['id', 'username', 'auth_token', 'chat_banned_until']
});

function getUsername(token, resultHandler) {

	if (token === null ) {
		resultHandler(null);
		return;
	}

	var username = null;
	var query = user
				.select(user.id, user.username, user.chat_banned_until)
				.from(user)
				.where(
					user.auth_token.equals(token)
				).toQuery();
	console.log(query.text);
	console.log(query.values);
	pg.connect(connString, function(err, client, done) {
		
		if (err) {
			console.log('error connecting to pg');
			console.log(err);
			done();
			return				
		}

		client.query(query.text, query.values, function(err, result) {

			//release a client back to the pool
			done();
			if (err) {
				console.log('error during request: ');
				console.log(err);
				return null;
			}
			console.log('The result is: ');
			console.log(result);
			if (result.rows && result.rows.length === 1) {
				var row = result.rows[0];
				var username = row['username'];
				var bannedUntil = row['chat_banned_until'];
				var id = row['id'];
				
				resultHandler({ "username": username, "bannedUntil": bannedUntil, "id": id });
				console.log('id is: ' + id);
				console.log('username is:' + username);
				console.log('banned until: '+ bannedUntil);
			}
		});
	});
}

// var rollback = function(client, done) {
//   client.query('ROLLBACK', function(err) {
//     //if there was a problem rolling back the query
//     //something is seriously messed up.  Return the error
//     //to the done function to close & remove this client from
//     //the pool.  If you leave a client in the pool with an unaborted
//     //transaction weird, hard to diagnose problems might happen.
//     return done(err);
//   });
// };

function banUser (userId, banUntil) {

	var updateQuery = user.update({chat_banned_until: banUntil})
									.where(user.id.equal(userId)).toQuery();

	pg.connect(connString, function(err, client, done) {
		if (err) {
			console.log('error connecting to pg');
			console.log(err);
			done();
			return
		}

		client.query(updateQuery.text, updateQuery.values, function(err, result) {
			//release a client back to the pool
			done();

		});

	});

}

module.exports.getUsername = getUsername;
module.exports.banUser = banUser;