const { Client, Intents, MessageEmbed } = require('discord.js');
const config = require("./config.private.json");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
let lastChannel={};                

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.private.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(JSON.parse(content), listEvents);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

let calendar={};
let calAuth={};

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
	
  calendar = google.calendar({version: 'v3', auth});
  calAuth=auth;
  if(!("CALENDAR_ID" in config) || !config.CALENDAR_ID){
		calendar.calendarList.list({}, (err, res)=>{
		  for(var key in res.data.items){
			  let cal = res.data.items[key];
			  console.log(cal.summary +": "+cal.id);
		  }		  
		  
		  console.log("Please insert the right calendar IDs into config.private.json in the CALENDAR_ID array.");
		});
  }else{
  
     queryUpcomingEvents(false,(start, event)=>console.log(`${start} - ${event.summary}`));
  }
}



function queryUpcomingEvents(calenderNickName,callback){
	let showCal = (calId)=>{
		let yesterday = new Date();
	   yesterday.setDate(yesterday.getDate() - 1);
	
		calendar.events.list({
			calendarId: calId,
			timeMin: yesterday.toISOString(),
			maxResults: 50,
			singleEvents: true,
			orderBy: 'startTime',
		  }, (err, res) => {
			if (err) return console.log('The API returned an error: ' + err);
			const events = res.data.items;
			if (events.length) {
			  console.log('Upcoming events:');
			  events.map((event, i) => {
				const start = event.start.dateTime || event.start.date;
				console.log(event);
				callback(start, event);
		   
		   
			  });
			} else {
			  console.log('No upcoming events found.');
			}
		  });
	}
	if(!calenderNickName){
		for(var key in config.CALENDAR_ID)
		{
		   var calId=config.CALENDAR_ID[key];
		   showCal(calId);
		}
	}else{
		if(calenderNickName in config.CALENDAR_ID){
			showCal(config.CALENDAR_ID[calenderNickName]);
		}else{
			console.log(`No calender nick found for ${calenderNickName}`);
			sendError("query calendar",`No calender nick found for ${calenderNickName}. Please look into "config.private.json"`);
		}
	}
}


                  

function sendEvents(calenderNickName, channel, filterAction){
	let internalId=0;
	if(!filterAction){
		filterAction=(internalId, event)=>true;
	}
	queryUpcomingEvents(calenderNickName,(start,event)=>{
		   if(filterAction(internalId, event)){  
		   
		   const exampleEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(event.summary)
			//.setURL('https://discord.js.org/')
			//.setAuthor('Calendar Manager', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
			.setDescription("<t:"+Math.floor(new Date(start).getTime() / 1000)+":F>")
			//.setThumbnail('https://i.imgur.com/AfFp7pu.png')
			.addFields(
				{ name: 'Calendar', value: event.organizer.displayName },
			)
			.addField('URL', event.location??"<NONE>", true)
			.addField("Select-ID",(internalId)+"")
			//.setImage('https://i.imgur.com/AfFp7pu.png')
			.setTimestamp()
			.setFooter('', 'https://i.imgur.com/AfFp7pu.png');

			channel.send({ embeds: [exampleEmbed] });
		   }
		   internalId++;
	   });
	
}


function sendError(title, message){
		   const exampleEmbed = new MessageEmbed()
			.setColor('#1199ff')
			.setTitle(title)
			//.setAuthor('Calendar Manager', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
			.setDescription(message)
			//.setThumbnail('https://i.imgur.com/AfFp7pu.png')
			//.setImage('https://i.imgur.com/AfFp7pu.png')
			.setTimestamp()
			.setFooter('Error-Message', 'https://i.imgur.com/AfFp7pu.png');

			lastChannel.send({ embeds: [exampleEmbed] });
}

function getTimeFromDiscord(timeStr){
	let regex=/<t:([0-9]+):.>/gm.exec(timeStr);
	   if(!regex){
		  sendError("Parsing Time",`"${commands[2]}" isn't a valid hammertime format. Use https://hammertime.djdavid98.art for a generator.`)
		  return;
	   }
	   return regex[1];
	
}


client.on("message", function(message) { 
   if (message.author.bot) return;
   lastChannel=message.channel;
   let commands = message.content.split(" ");
    
   if(commands.length<1) return;
   let calenderNickName=commands[1];
   
   // TODO error handling
   let calendarID=config.CALENDAR_ID[calenderNickName];
   if(!calendarID){
	  sendError("Calendar nickname not found",`${calenderNickName} was not found in "config.private.json"`);
	  return;
   }
   
   if(commands[0] == "c.list"){
	   sendEvents(calenderNickName, message.channel);
   }
   if(commands[0] =="c.add"){
	   console.log(commands);
	   let discordTime=getTimeFromDiscord(commands[2]);
	   let startTime=new Date(parseInt(discordTime)*1000);
	   let endTime=new Date((parseInt(discordTime)+3600)*1000);
	   let rest= commands.slice(3);
	   let location="";
	   if(rest[0].indexOf("http")==0){
		  location=rest[0];
		  rest=rest.slice(1);
	   }
	   let summary =rest.join(" ");
	   
	   console.log(calendarID);	 
	   calendar.events.insert({
		   calendarId:calendarID,
		   auth:calAuth,
		   resource:{
		   start:{dateTime:startTime},
		   end:{dateTime:endTime},
		   summary:summary,
		   location:location
	   }
	   });
	   setTimeout(()=>sendEvents(calenderNickName, message.channel),1000);
   }
   let internalUpdateId=0;
   if(commands[0]=="c.update")
   {
	  let calenderNickName=commands[1];
	  let selectID=parseInt(commands[2]);
	  let field=commands[3];
	  let action=false;
	  let update=true;
	  let content = commands.slice(4).join(" ");
	  if(field=="url"){
		 action=(event)=>event.location=content;
	  }else if(field=="title"){
		 action=(event)=>event.summary=content;
	  }
	  else if(field=="cal"){
		 let newCalendarID=config.CALENDAR_ID[content];
		 if(!newCalendarID){
		     sendError("No calendar found",`Couldn't find calendar to move event to. Hint: No "${newCalendarID}" in config.private.json`);
			 return;
		 }
		 action=(event)=>{
			 calendar.events.move({
	               calendarId:calendarID,
				   eventId:event.id,
				   auth:calAuth,
				   destination:newCalendarID
			 });
		 }
		 setTimeout(()=>sendEvents(content, message.channel, (internalId, event)=>event.id==UpdatedEventId),1000);
		 update=false;
		 
	  }
	  else if(field=="start"){
		  let discordTime=getTimeFromDiscord(commands[2]);
	      let startTime=new Date(parseInt(discordTime)*1000);
	      let endTime=new Date((parseInt(discordTime)+3600)*1000);
		  action=(event)=>{
			  event.start=startTime;
			  event.end=endTime;
		  }
	  }
	  else{
		  // error case
		  sendError("wrong field",`Field "${field}" not found. Supported are url, title, start, cal.`);
		  return;
	  }
	  let UpdatedEventId="";
	  queryUpcomingEvents(calenderNickName, (start,event)=>{
		  if(internalUpdateId==selectID){
			 action(event);
			 UpdatedEventId=event.id;
			 if(update){
				 calendar.events.update({
					 
				   calendarId:calendarID,
				   eventId:event.id,
				   auth:calAuth,
						   resource:event
				   
				 });
			 }
		  }
		  internalUpdateId++;
     });
	 if(update){
	    setTimeout(()=>sendEvents(calenderNickName, message.channel, (internalId, event)=>event.id==UpdatedEventId),1000);
	 }
   }
   
   console.log(message.content);   
});  

client.login(config.BOT_TOKEN);