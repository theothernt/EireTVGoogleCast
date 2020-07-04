const castContext = cast.framework.CastReceiverContext.getInstance();
//const castDebugLogger = cast.debug.CastDebugLogger.getInstance();

const playerManager = castContext.getPlayerManager();
const TAG = 'EireTV';

var epgTimeout;

//const playbackConfig = new cast.framework.PlaybackConfig();
//playbackConfig.autoResumeDuration = 5;

//castDebugLogger.setEnabled(true);
//castDebugLogger.showDebugLogs(false);

/**
 * Load interceptor
 */
playerManager.setMessageInterceptor(
    cast.framework.messages.MessageType.LOAD,
    (request) => {
      
      console.log(request);
      window.clearTimeout(epgTimeout);

      let channelId = findInCustomData(request, 'channelId');
      if (channelId !== null && channelId !== "") {
          request.media.metadata.title = "";
          request.media.metadata.subtitle = "";
          loadGuideDataForChannel(channelId);
      }
      else {
          playerManager.getQueueManager().setContainerMetadata(null);
      }

      return request;
    }
);

/**
 * Gets the current program guide data
 * @return {cast.framework.messages.MediaMetadata[]} Latest program guide data
 */
function loadGuideDataForChannel(channelId) {

  //console.log("Looking up EPG data for: " + channelId);

  const currentTime = parseInt(new Date().getTime() / 1000).toFixed(0);
  const currentDate = getSimpleIsoDate();
  const url = `https://awk.epgsky.com/hawk/linear/schedule/${currentDate}/${channelId}`;

  return fetch(url)
      .then((response) => response.json())
      .then(function(data) {
        
        const events = data.schedule[0].events;
        let limit = events.length;
        const containerMetadata = new cast.framework.messages.ContainerMetadata();
        containerMetadata.sections = [];
        
        for (let i=0; i<limit; i++) {
          let showTime = events[i].st + events[i].d;
          
          if (currentTime < showTime) {
            const show = new cast.framework.messages.TvShowMediaMetadata();
            show.title =  events[i].t;
            show.seriesTitle = events[i].sy;
            show.sectionStartAbsoluteTime = events[i].st;
            show.sectionDuration = events[i].d;
            containerMetadata.sections.push(show);

            // Grab the next 4 shows or until the end of the list
            let newLimit = i+4;
            if (newLimit < limit) {
                limit = newLimit;
            } 
          } 
        }

        const lastShow = events[limit-1];
        const endTime = (lastShow.st + lastShow.d) - currentTime;
        epgTimeout = window.setTimeout(loadGuideDataForChannel, endTime * 1000, channelId);

        //console.log("Next EPG update at: " + epocToReadableDate(lastShow.st + lastShow.d));

        playerManager.getQueueManager().setContainerMetadata(containerMetadata);
      });
}

/**
 * Find value in CustomData dictionary
 */
function findInCustomData(request, key)
{
  const data = request.media.customData;

  // for Windows/legacy
  if (Array.isArray(data)) {
    for (let i=0; i<data.length; i++) {
      if (typeof data[i] === 'object' && data[i] !== null) {
        if (data[i].Key !== null && data[i].Key === key) {
        	//console.log("Found legacy channel id");
          return data[i].Value;
        }
      }
    }
  }

  // iOS, Android, etc
  if (typeof data === 'object') {
    if (key in data) {
    	//console.log("Found channel id");
      return data[key];
    }
  }

	//console.log("Channel id not found");
  return null;
}

/**
 * Return a human readable date
 */
function epocToReadableDate(seconds) {
  var d = new Date(0);
  d.setUTCSeconds(seconds);
  return d.toLocaleString();
}

/**
 * Return current date in YYYYMMDD format
 */
function getSimpleIsoDate() {
  function twoDigit(n) { return (n < 10 ? '0' : '') + n; }
  var now = new Date();
  return '' + now.getFullYear() + twoDigit(now.getMonth() + 1) + twoDigit(now.getDate());
}

//castContext.start({ playbackConfig: playbackConfig });
castContext.start();