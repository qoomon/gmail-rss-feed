// source: https://github.com/qoomon/gmail-rss-feed

// --------------- config ---------------------
const rssFeedGmailRootLabel = 'RSS'
const rssFeedMaxItems = 50

// --------------- entrypoint ---------------------
function doGet(event) {
  Logger.log("[EVENT]")
  Logger.log('Parameters:', event.parameter)
  const response = doGetRssFeedXml(event)
  Logger.log('[RESPONSE]')
  Logger.log('MimeType:', response.getMimeType())
  Logger.log('Content...')
  Logger.log(response.getContent())
  return response
}

function doGetRssFeedXml(event) {
  // --------------- input parameters---------------------

  const rssFeedName = event.parameter['gmail-rss-feed']
  if (!rssFeedName) {
    return ContentService.createTextOutput("400 - 'feed' parameter missing")
  }
  const isMultiAuthor = ['', 'true'].includes(event.parameter['multi-author'])
  const rssFeedTitle = event.parameter.title

  // --------------- gather rss mails---------------------

  const gmailFeedLabel = GmailApp.getUserLabelByName(`${rssFeedGmailRootLabel}/${rssFeedName}`)
  if (!gmailFeedLabel) {
    return ContentService.createTextOutput(`400 - '${rssFeedName}' feed not found`)
  }

  const gmailFeedMessages = gmailFeedLabel.getThreads(0, rssFeedMaxItems)
    .map(thread => thread.getMessages()[0])

  // --------------- create rss feed ---------------------

  const rssFeedDescription = `${rssFeedName} - Gmail RSS Feed`
  const rssFeed = {
    title: rssFeedTitle || rssFeedDescription,
    description: rssFeedDescription,
    link: `https://mail.google.com/#label/${gmailFeedLabel.getName()}`,
    image: 'https://ssl.gstatic.com/ui/v1/icons/mail/favicon.ico',
    atomLink: ScriptApp.getService().getUrl(),
    items: gmailFeedMessages.map(gmailMessage => {
      const messageSender = gmailMessage.getFrom().match(/^(?<name>.*) <(?<email>.*)>$/).groups
      const itemAuthor = `${messageSender.email} (${messageSender.name})`
      const itemTitle = `${isMultiAuthor ? `${messageSender.name} - ` : ''}${gmailMessage.getSubject()}`
      return {
        guid: gmailMessage.getId(),
        author: itemAuthor,
        title: itemTitle,
        link: `https://mail.google.com/mail/u/0/#label/${gmailFeedLabel.getName()}/${gmailMessage.getId()}`,
        description: gmailMessage.getBody(),
        pubDate: gmailMessage.getDate()
      }
    })
  }

  const rssFeedXmlElement = createRssFeedXmlElement(rssFeed)
  const rssFeedXmlDocument = XmlService.createDocument(rssFeedXml)
  const rssFeedXmlText = XmlService.getPrettyFormat().format(rssFeedXmlDocument)
  return ContentService.createTextOutput(rssFeedXmlText)
    .setMimeType(ContentService.MimeType.RSS)
}

function createRssFeedXmlElement(rssObject) {
  const rss = XmlService.parse("<rss xmlns:atom='http://www.w3.org/2005/Atom' version='2.0'/>").getRootElement()
  return rss.addContent(xmlElement('channel', channel => {
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
        .setNamespace(rss.getNamespace('atom'))
        .setAttribute('href', rssObject.atomLink)
        .setAttribute('rel', 'self')
        .setAttribute('type', 'application/rss+xml'))
    }
    rssObject.items.forEach(itemObject => {
      channel.addContent(createRssFeedItemXmlElement(itemObject))
    })
  }))
}

function createRssFeedItemXmlElement(itemObject) {
  return xmlElement('item', item => {
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
  })
}

function xmlElement(name, modifier) {
  const element = XmlService.createElement(name)
  if (modifier) {
    modifier(element)
  }
  return element
}

function debug_doGet() {
  doGet({
    parameter: {
      'gmail-rss-feed': 'Newsletter',
      'multi-account': 'true'
    }
  })
}
