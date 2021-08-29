# Calendar Manager
This project is a simple bot that can connect a Discord Bot with a Google Calendar.

# Installation
This Bot needs a Google Cloud API project to work with and the appropriate scopes to change entries.  

A few files aren't included in this project those are:
## config.private.json

This file hosts two entries: *BOT_TOKEN* being the Discord Bot token as a string and *CALENDAR_ID* 
an object with key as calendar alias for the api and and the value being the Google Calendar ID

## credentials.private.json

Being the Desktop application OAuth 2.0 credentials file from the Google Cloud API.

## token.json

This file gets automatically created with the first start and holds the authorization tokens for the calendar.

# Configuration

After the granting of write / read permissions on the calendar, this application will show all the available calendars.
Afterwards the config.private.json needs to be updated. This can look like the following:

"CALENDAR_ID":{"keyara":"REDACTED@group.calendar.google.com","forest":"GUH@group.calendar.google.com"}

# Usage

After inviting the Bot to the Discord, this bot will react to following commands

    c.list <calendar nickname>

    c.add <calendar nickname> <timeformat in Hammertime> <url optional for location field> <summary of the event>

    c.update <calendar nickname> <internal select-id> <field> <content>

TBD: Add a help command and more explanation... 