# Gmail RSS Feed
A [Google Scripts](https://script.google.com) Web App to dynamicaly generate an RSS feed based on labeled emails (`RSS/<RSS_FEED_NAME>`)

### Installation
* Create a blank project on https://script.google.com/
* Copy content `Code.gs` into your new project
* Run the script once by clicking Menu `Run > doGet` 
  * You will be asked to grant this script access to your Gmail account
  * Accept the request
* Create a first version by clicking Menu `File > Manage Versions`
* Deploy this script by clicking Menu `Publish > Deploy as web app`
  * Select `Execute the app as : me`
  * Select `Who has access to the app : Anonyone, even anonymous`
  * Copy `Current web app URL` e.g. `https://script.google.com/macros/s/<SCRIPT_ID>/exec`
  * ⚠️ Everyone with this URL is potentialy able to read all mails labled with `RSS/<RSS_FEED_NAME>`
* Label your first emails with a nested `RSS` label (`RSS/<RSS_FEED_NAME>`) e.g. `RSS/Newsletter`
* Create your feed URL by add following query parameters to `Current web app URL`
  * `gmail-rss-feed=<RSS_FEED_NAME>` selects rss feed name of coresponding Gmail label (`RSS/<RSS_FEED_NAME>`)
  * `multi-author=true` query parameter prepends the author name to feed item titles
  * Example URL `https://script.google.com/macros/s/<SCRIPT_ID>/exec?gmail-rss-feed=Newsletter&multi-author=true`
