var app     = require('express')();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var Events  = require('events')
var Twitter = require('node-twitter');

var tweet_emitter  = new Events.EventEmitter();

var twitterSearchClient = new Twitter.SearchClient(
    'cP7TpyHFY3SMqRW8cZNIow',
    'c2tkXUeTQDy4FqUFwjCxKlLxVgsp6joMNWj2NgTJY',
    '2326109492-nQqNZOTrGcgCoFI3qeBrkNrD8Mm3pxZWtE1g0Kk',
    '9MW0Q0wOJkw6U9hAxfX18zosR3D7NszHkK6E0uEzkqiWt'
);

function get_tweets(query) {	
	twitterSearchClient.search({'q': query}, function(error, result) {
		if (error) {
			console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
		}
		if (result) {			
			result.statuses.forEach(function (status) {
				tweet_emitter.emit('new_tweet_from_server', status.user.screen_name + ': ' + status.text);
			});
		}
	});
}

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html')
});

io.sockets.on('connection', function(socket) {
	var client_ip_address = socket.request.connection.remoteAddress;
	console.log('Client from ' + client_ip_address + ' has connected');
	
	var onTweetCallback = function(tweet) {
		socket.emit('new_tweet_to_clients', tweet);
    };
	
	socket.on('search', function(q){
		console.log('Client from ' + client_ip_address + ' has searched for tweets containing "' + q + '"');
		get_tweets(q);
		tweet_emitter.on('new_tweet_from_server', onTweetCallback);
	});
	
	socket.on('disconnect', function(){
		console.log('Client from ' + client_ip_address + ' has disconnected');
		tweet_emitter.removeListener("new_tweet_from_server", onTweetCallback);
	});

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
