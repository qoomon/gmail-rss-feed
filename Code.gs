// --------------- config ---------------------
var rssFeedMaxItems = 50

// --------------- entrypoint ---------------------
function doGet(event) {
  
  Logger.log(event)

  // --------------- input parameters---------------------

  var rssFeedName = event.parameter['gmail-rss-feed']
  if (!rssFeedName) {
    Logger.log("! 400 - 'feed' parameter missing")
    return ContentService.createTextOutput("! 400 - 'feed' parameter missing")
  }

  var isMultiAuthor = ['', 'true'].includes(event.parameter['multi-author'])

  // --------------- gather rss mails---------------------

  var gmailLabelName = 'RSS/' + rssFeedName
  var gmailLabel = GmailApp.getUserLabelByName(gmailLabelName)
  if (!gmailLabel) {
    Logger.log("! 400 - 'feed' not found")
    return ContentService.createTextOutput("! 400 - 'feed' not found")
  }
  var threads = gmailLabel.getThreads(0, rssFeedMaxItems)

  // --------------- create rss feed ---------------------

  var rssDescription = `${rssFeedName} - Gmail RSS Feed`
  var rssTitle = event.parameter.title || rssDescription
  var rss = {
    title: rssTitle,
    description: rssDescription,
    link: `https://mail.google.com/#label/${gmailLabelName}`,
    image: 'https://ssl.gstatic.com/ui/v1/icons/mail/favicon.ico',
    atomLink: ScriptApp.getService().getUrl(),
    items: threads
      .map(thread => thread.getMessages()[0])
      .map(message => {
        var authorParts = message.getFrom().match(/^(?<name>.*) <(?<email>.*)>$/).groups
        var author = `${authorParts.email} (${authorParts.name})`
        var title = message.getSubject()
        if (isMultiAuthor) {
          title = `${authorParts.name} - ${title}`
        }
        return {
          guid: message.getId(),
          author: author,
          title: title,
          link: `https://mail.google.com/mail/u/0/#label/${gmailLabel}/${message.getId()}`,
          description: message.getBody(),
          pubDate: message.getDate()
        }
      })
  }

  var rssXml = rssToXml(rss)
  var rssXmlText = XmlService.getPrettyFormat().format(rssXml)
  return ContentService.createTextOutput(rssXmlText)
    .setMimeType(ContentService.MimeType.RSS)
}

function xmlElement(name, modifier) {
  var element = XmlService.createElement(name)
  if (modifier) {
    modifier(element)
  }
  return element
}

function rssToXml(rssObject) {
  var xml = XmlService.parse("<rss xmlns:atom='http://www.w3.org/2005/Atom' version='2.0'/>")
  var rss = xml.getRootElement()
  var atomNs = rss.getNamespace('atom')
  rss.addContent(xmlElement('channel', channel => {
    channel.addContent(xmlElement('title').setText(rssObject.title))
    channel.addContent(xmlElement('description').setText(rssObject.description))
    channel.addContent(xmlElement('link').setText(rssObject.link))
    if (rssObject.image) {
      channel.addContent(xmlElement('image')
        .addContent(xmlElement('url').setText(rssObject.image))
        .addContent(xmlElement('title').setText(rssObject.title))
        .addContent(xmlElement('link').setText(rssObject.link)))
    }
    if (rssObject.atomLink) {
      channel.addContent(XmlService.createElement('link')
        .setNamespace(atomNs)
        .setAttribute('href', rssObject.atomLink)
        .setAttribute('rel', 'self')
        .setAttribute('type', 'application/rss+xml'))
    }
    // ---------- Items --------------
    rssObject.items.forEach(itemObject => {
      channel.addContent(xmlElement('item', item => {
        item.addContent(xmlElement('title').setText(itemObject.title))
        item.addContent(xmlElement('link').setText(itemObject.link))
        item.addContent(xmlElement('description')
          .addContent(XmlService.createCdata(itemObject.description)))
        if (itemObject.pubDate) {
          item.addContent(xmlElement('pubDate')
            .setText(Utilities.formatDate(itemObject.pubDate, 'UTC', "EEE, dd MMM yyyy HH:mm:ss Z")))
        }
        if (itemObject.guid) {
          item.addContent(xmlElement('guid').setText(itemObject.guid))
        }
        if (itemObject.author) {
          item.addContent(xmlElement('author').setText(itemObject.author))
        }
      }))
    })
  }))
  return xml
}
