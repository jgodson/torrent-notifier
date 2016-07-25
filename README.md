#This App is still under construction. Needs a few things before I call it V1.0.

###Also only tested on OSX 10.11.5 so far. Will test on Windows 10 and 7 once I finish to V1.0 release.

![alt tag](http://jasongodson.com/blog/wp-content/uploads/2016/07/Screen-Shot-2016-07-23-at-9.48.13-PM-1024x650.png)
>Add all your favourite shows! Poster art is automatically downloaded

![alt tag](http://jasongodson.com/blog/wp-content/uploads/2016/07/Screen-Shot-2016-07-23-at-9.48.20-PM-1024x650.png)
>Hover over a show to show the options.

![alt tag](http://jasongodson.com/blog/wp-content/uploads/2016/07/Screen-Shot-2016-07-23-at-5.17.04-PM-1024x650.png)
>New/Edit show dialog. Attempts auto population of fields and download of poster art after filling in Show Name.
>This uses the tvmaze API http://www.tvmaze.com/api

![alt tag](http://jasongodson.com/blog/wp-content/uploads/2016/07/Screen-Shot-2016-07-23-at-5.17.57-PM-1024x650.png)
>Dropdown menu for selecting timezone and air day

![alt tag](http://jasongodson.com/blog/wp-content/uploads/2016/07/Screen-Shot-2016-07-23-at-5.13.19-PM-1024x650.png)
>Logs for info and debugging. You can see the automatically scheduled checks here (App needs to stay running for checks to >run)

![alt tag](http://jasongodson.com/blog/wp-content/uploads/2016/07/Screen-Shot-2016-07-23-at-5.14.00-PM-1024x650.png)
>Calendar view shows you the actual air day and time of your shows.

![alt tag](http://jasongodson.com/blog/wp-content/uploads/2016/07/Screen-Shot-2016-07-23-at-9.50.46-PM-1024x650.png)
>Manual checking for torrents. Next episode to look for is automatically adjusted when current episode is found. If you are >behind, it should find the past few episodes.

![alt tag](http://jasongodson.com/blog/wp-content/uploads/2016/07/Screen-Shot-2016-07-23-at-5.14.10-PM-1024x650.png)
>Settings and fancy notifications shown here. (New torrent notifications are native, not in-app)

###Settings Descriptions:
Tray Icon: Show tray icon or not. (Really does nothing at the moment, besides a reminder that app is running)
Notifications: Native notifications of new show available
Automatic Downloads: Opens magnet link as soon as new show is found. If you turn off the dialog in your torrent client, you   can automate the downloads of your shows!
Auto Show Search: When enabled, it will try to get show info from the tvmaze API after filling out the Show Name field.
Check For Torrents: This enables or disables automatic checking for torrents after new show should be available.

###This project uses the following API's
http://www.tvmaze.com/api
https://torrentproject.se/api
