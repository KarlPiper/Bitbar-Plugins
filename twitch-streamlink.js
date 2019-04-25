#!/usr/bin/env /usr/local/bin/node

// <bitbar.title>Twitch Streamlink</bitbar.title>
// <bitbar.version>v2.3</bitbar.version>
// <bitbar.author>Stefan du Fresne</bitbar.author>
// <bitbar.author.github>SCdF</bitbar.author.github>
// <bitbar.desc>Shows which channels you follow are live, what they're playing, for how long etc. Lets you watch them with streamlink and open the chat in your browser. Based on the play-with-livestreamer bitbar plugin. Requires a Twitch account.</bitbar.desc>
// <bitbar.image>https://i.imgur.com/dhscE7r.png</bitbar.image>
// <bitbar.dependencies>node, streamlink</bitbar.dependencies>

// CUSTOM VERSION CHANGES
// original https://github.com/matryer/bitbar-plugins/blob/master/Web/Twitch/livestreamer-now-playing.5m.js
// explicit path to config file containing auth token (line 25)
// custom darkmode responsive templateImage icon (line 59)
// modified menu text (lines 87-92)

'use strict';

/*jshint esversion: 6 */

const fs = require('fs');

const STREAMLINK_PATH = '/usr/local/bin/streamlink';
//const STREAMLINK_CONFIG_PATH = process.env.HOME + '/.config/streamlink/config';
const STREAMLINK_CONFIG_PATH = '/Users/piper/.streamlinkrc';
const AUTH_PROP_KEY = 'twitch-oauth-token';
const ACCESS_TOKEN = readAccessToken();

const OPTIONS = {
	// The followers you care about. This affects the bitbar tray count,
	// notifications and other stuff.
	//
	// Leave as false to count everyone
	// An empty list means no one
	// Otherwise list twitch stream usernames, as strings, or regex, or a function
	// predicate that evaluates over the stream object
	// e.g.
	// FAVOURITES: [
	//   'manvsgame',
	//   /evo[0-9]/,
	//   stream => stream.channel.name === 'itmejp' && stream.channel.status.includes('Dropped Frames')
	// ],
	// Would show MANvsGAME as a favourite, along with any of the evo rooms, along
	// with itmeJP if he's streaming Dropped Frames
	FAVOURITES: false,
	// True if you want native OSX notifications when a favourite goes live
	// (if favourites are disabled notifications will work on everyone)
	NOTIFICATIONS: true,
	// True if we want to count the game changing as a new notification
	NOTIFICATIONS_ON_GAME_CHANGE: true,
	// True if we want to count a VOD-cast as favourite-worthy
	// TODO: switching from VOD to live should generate notification
	//       This will be much easier once we do the TODO at the top of the page
	//       to map the datastructure, because then notification code can easily
	//       understand if it's a VOD or not
	FAVOURITES_WITH_VOD: false
};

const TWITCH_ICON_36_RETINA = "iVBORw0KGgoAAAANSUhEUgAAACMAAAAgCAYAAACYTcH3AAAACXBIWXMAABYlAAAWJQFJUiTwAAAId2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTYtMDQtMDlUMTY6MDY6MjIrMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE4LTA4LTI5VDA1OjU0OjMwLTA3OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE4LTA4LTI5VDA1OjU0OjMwLTA3OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmQwY2E5Y2I2LTBiNmEtNDNhOS1iOTk1LTQ0ZWFhZmM3YjBjNyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmNlZGY4YmNiLTRjYzgtNmU0YS04NDgwLTU2NGY2NGVkN2FkNiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjYzRUJDOTVDQTBDQzExRTNCRjU1OEFFRTJEQkQzMDM3IiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB0aWZmOk9yaWVudGF0aW9uPSIxIiB0aWZmOlhSZXNvbHV0aW9uPSIxNDQwMDAwLzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSIxNDQwMDAwLzEwMDAwIiB0aWZmOlJlc29sdXRpb25Vbml0PSIyIiBleGlmOkNvbG9yU3BhY2U9IjY1NTM1IiBleGlmOlBpeGVsWERpbWVuc2lvbj0iMzIiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSIzMiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjYzRUJDOTU5QTBDQzExRTNCRjU1OEFFRTJEQkQzMDM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjYzRUJDOTVBQTBDQzExRTNCRjU1OEFFRTJEQkQzMDM3Ii8+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjRlNmU4YmNhLWU0NzAtNDNkYy04NmMxLTViMmZlYTRjNmIzZCIgc3RFdnQ6d2hlbj0iMjAxNi0wNC0wOVQxNjoxNjozOSswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmQwY2E5Y2I2LTBiNmEtNDNhOS1iOTk1LTQ0ZWFhZmM3YjBjNyIgc3RFdnQ6d2hlbj0iMjAxOC0wOC0yOVQwNTo1NDozMC0wNzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPnhtcC5kaWQ6MjhjMzEyNjQtOGFjZi00NjM1LWJkYzgtMGE4MjkxNmVjZjgwPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+f4j5ugAAAItJREFUWIXt0VEOgCAMA1DO4yXxkHqeEfwiiJu6BvqxJv1iSV9CEpHUdJM1ufZbSG1mwhwsmNEX9VhkVUxmwpxMmFEC8wdj3X1+D0xgAhMYZoy3NJjMgukhyzAjyL4Co0JmYkzIG8xTrCErNwgCA4N4MVCIBwOHeDBwSI/RChmbgYFAEBgYxIuBQmoLwh/aauyJIOAAAAAASUVORK5CYII=";

function readAccessToken() {
	try {
		const data = fs.readFileSync(STREAMLINK_CONFIG_PATH, 'utf8');
		if (data) {
			const line = data.split('\n').find(line => line.indexOf(AUTH_PROP_KEY) >= 0);

			return line.substring(line.indexOf('=') + 1);
		}
	} catch (e) {}
}

function outputForStream(stream) {
	const channel = stream.channel;

	let timeLive = Math.floor((Date.now() - Date.parse(stream.created_at)) / 1000 / 60);
	if (timeLive > 60) {
		timeLive = Math.floor(timeLive / 60) + 'h ' + (timeLive % 60) + 'm';
	} else {
		timeLive = timeLive + 'm';
	}


	const name = `${!live(stream) ? '[' : ''}${channel.display_name}${!live(stream) ? ']' : ''}`;

	return [
      `${name} | href=https://twitch.tv/${channel.name}`,
      `--🌊 ${live(stream) ? 'Stream to Desktop' : 'VOD'} | terminal=false bash=${STREAMLINK_PATH} param1=${channel.url.replace('http://', '')}`,
      `--Twitch Chat | href=https://twitch.tv/${channel.name}/chat?popout=`,
      `--Chit.Chat | href=https://chitchat.ma.pe/${channel.name}`,
      `-----`,
      isFavourite(stream) ? `--${stream.channel.game}|size=10 color=#888888` : undefined,
      `--${stream.viewers} watching, live for ${timeLive}`,
      ''].join('\n');
}

function endOutput() {
	console.log('---');
	console.log('Refresh | refresh=true');
}

const streamName = stream => stream.channel.name;
const live = stream => stream.stream_type === 'live';
const isFavourite = stream =>
	OPTIONS.FAVOURITES && OPTIONS.FAVOURITES.find(f =>
		typeof f === 'function' ? f(stream) :
		f instanceof RegExp ? streamName(stream).match(f) :
		streamName(stream) === f) &&
	(OPTIONS.FAVOURITES_WITH_VOD || live(stream));

function notifications(streams) {
	const TEMP_FILE = '/tmp/livestreamer-now-playing.json';
	const statusFile = () => {
		try {
			return JSON.parse(fs.readFileSync(TEMP_FILE, 'utf8'));
		} catch (error) {
			return {
				live: []
			};
		}
	};

	if (fs.existsSync(TEMP_FILE)) {
		const status = statusFile();
		const currentStreamers = streams.filter(isFavourite);
		const changedStreams = currentStreamers.filter(stream =>
			// Just went live
			!Object.keys(status.live).includes(streamName(stream)) ||
			// Just changed games
			(OPTIONS.NOTIFICATIONS_ON_GAME_CHANGE &&
				status.live[streamName(stream)].game !== stream.channel.game));

		if (changedStreams.length) {
			const exec = require('child_process').exec;
			const safe = text => text.replace(/('|")/, "");

			// TODO: better notification approach
			//       osascript doesn't let you set the click action
			//       https://stackoverflow.com/questions/24606225/redirected-to-applescript-editor-on-clicking-apple-notification
			changedStreams.map(stream =>
				exec(`osascript -e 'display notification "${safe(stream.channel.status)}" with title "${safe(streamName(stream))} is playing ${safe(stream.channel.game)}" sound name "Ping"'`));
		}
	}

	fs.writeFileSync(TEMP_FILE, JSON.stringify({
		live: streams.reduce((live, s) => {
			live[streamName(s)] = {
				game: s.channel.game
			};
			return live;
		}, {})
	}));
}

function handleResponse(body) {
	const streamByGame = {};

	if (!(body && body.streams)) {
		console.log(':-(');
		console.log('---');
		console.log(body);
		return endOutput();
	}

	const onlineStreams = body.streams.filter(stream => !stream.is_playlist);

	const importantStreams = [];

	onlineStreams.forEach(stream => {
		if (isFavourite(stream)) {
			return importantStreams.push(stream);
		}

		if (!streamByGame[stream.channel.game]) {
			streamByGame[stream.channel.game] = [];
		}

		streamByGame[stream.channel.game].push(stream);
	});

	const outputs = [];

	if (importantStreams.length) {
		outputs.push(importantStreams.map(outputForStream).join(''));
	}

	for (const game in streamByGame) {
		outputs.push([game, '| size=10 color=#555555 length=30\n', streamByGame[game].map(outputForStream).join('')].join(''));
	}

	if (onlineStreams.length === 0) {
		console.log('|templateImage="' + TWITCH_ICON_36_RETINA);
	} else {
		const count =
			(OPTIONS.FAVOURITES ? importantStreams.length : onlineStreams.length) || '';
		console.log(count + '|image="' + TWITCH_ICON_36_RETINA);
	}

	console.log('---\n' + outputs.join('\n---\n'));

	endOutput();

	if (OPTIONS.NOTIFICATIONS) {
		notifications(onlineStreams);
	}
}
try {
	if (ACCESS_TOKEN) {
		const urlHost = 'api.twitch.tv';
		const urlPath = '/kraken/streams/followed';

		require('https').get({
			hostname: urlHost,
			path: urlPath,
			headers: {
				'Authorization': 'OAuth ' + ACCESS_TOKEN
			}
		}, res => {
			let body = '';
			res.on('data', data => body += data);
			res.on('end', () => {
				try {
					handleResponse(JSON.parse(body));
				} catch (error) {
					console.log(':-(');
					console.log('---');
					console.log(error);
					endOutput();
				}
			});
			res.on('error', err => {
				console.log(':-(');
				console.log('---');
				console.log(err);
				endOutput();
			});
		});
	} else {
		console.log('💔');
		console.log('---');
		console.log('Click to authenticate streamlink | terminal=false bash=' + STREAMLINK_PATH + ' param1=--twitch-oauth-authenticate');
		endOutput();
	}
} catch (error) {
	console.log(':-(');
	endOutput();
}
