<h3>This desktop app, created with electron, allows you to add your favourite shows. After which, you are able to keep track of your show dates on a calendar, have the latest episodes of your shows downloaded automatically after airing, or be notified of when they are available to download.</h3>
<h5>I have tested on Mac OSX 10.11.6 as well as Windows 7 and 10</h3>

<h6>How to get this desktop app on your computer:</h6>
<ol>
<li>Clone this repository on your computer</li>
<li>Run <code>npm install</code>
<li>Run <code>npm start</code>
</ol>

<h4>NOTE: This is a personal project created for demo purposes.</h4>

<img src='https://res.cloudinary.com/jgodson/image/upload/v1509251291/List_xzuchr.png' />

Add all your favourite shows! Poster art is automatically downloaded

<img src='https://res.cloudinary.com/jgodson/image/upload/v1509251421/List_Options_pez3lg.png' />

Hover over a show to show the options.

<img src='http://res.cloudinary.com/jgodson/image/upload/v1509251275/dialog_y6mltg.png' />

New/Edit show dialog. Attempts auto population of fields and download of poster art after filling in Show Name. This uses the [tvmaze API](http://www.tvmaze.com/api)

<img src='https://res.cloudinary.com/jgodson/image/upload/v1509251293/Logs_za2fue.png' />

Logs for info and debugging. You can see the automatically scheduled checks here (App needs to stay running for checks to run)

<img src='https://res.cloudinary.com/jgodson/image/upload/v1509251268/Calendar_uyz23w.png' />

Calendar view shows you the actual air day and time of your shows.

<img src='https://res.cloudinary.com/jgodson/image/upload/v1509251300/Settings_jir6di.png'>

Settings and fancy notifications shown here. (New torrent notifications are native as well as in-app)

<img src='https://res.cloudinary.com/jgodson/image/upload/v1509251297/Notifications_w31htu.png' />

In app torrent notification list! If you turn off native notifications and automatic downloads, you will still see a notification here whenever a new episode is found.

<img src='https://res.cloudinary.com/jgodson/image/upload/v1509251295/Native_Notifications_nckzhf.png' />

These are the native notifications shown on OSX

<h3>Settings Descriptions:</h3>
**Tray Icon**: Show tray icon or not. (Really does nothing at the moment, besides a reminder that app is running)

**Notifications**: Native notifications of new show available

**Automatic Downloads**: Opens magnet link as soon as new show is found. If you turn off the dialog in your torrent client, you can automate the downloads of your shows!

**Auto Show Search**: When enabled, it will try to get show info from the tvmaze API after filling out the Show Name field.

**Check For Torrents**: This enables or disables automatic checking for torrents after new show should be available.


<h3>This project uses the following API's</h3>
http://www.tvmaze.com/api
