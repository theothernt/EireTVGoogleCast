const castContext = cast.framework.CastReceiverContext.getInstance();
const castDebugLogger = cast.debug.CastDebugLogger.getInstance();

const playerManager = castContext.getPlayerManager();
playerManager.removeSupportedMediaCommands(cast.framework.messages.Command.SEEK, true);

const LOG_TAG = 'APP';

const playbackConfig = new cast.framework.PlaybackConfig();
playbackConfig.autoResumeNumberOfSegments = 1;
playbackConfig.autoResumeDuration = 1;
playbackConfig.autoPauseDuration = 1;

const options = new cast.framework.CastReceiverOptions();
options.playbackConfig = playbackConfig;
options.disableIdleTimeout = true;
options.maxInactivity = 3600;

// Enable debug logger and show a 'DEBUG MODE' overlay at top left corner.
castDebugLogger.setEnabled(true);

castDebugLogger.showDebugLogs(false);

// Set verbosity level for Core events.
castDebugLogger.loggerLevelByEvents = {
  'cast.framework.events.category.CORE': cast.framework.LoggerLevel.INFO,
  'cast.framework.events.EventType.MEDIA_STATUS': cast.framework.LoggerLevel.DEBUG
}

// Set verbosity level for custom tags.
castDebugLogger.loggerLevelByTags = {
  [LOG_TAG]: cast.framework.LoggerLevel.DEBUG,
};

/**
 * Load interceptor
 */
playerManager.setMessageInterceptor(
    cast.framework.messages.MessageType.LOAD,
    (request) => {
      
      castDebugLogger.info(LOG_TAG, 'Intercepting LOAD request');
      //castDebugLogger.info(LOG_TAG, 'Request data:', request);

      return request;
    },

    cast.framework.messages.MessageType.SEEK,
    (seekData) => {
      // if the SEEK supported media command is disabled, block seeking
      if (!(playerManager.getSupportedMediaCommands() &
      cast.framework.messages.Command.SEEK)) {
        castDebugLogger.info(TAG, 'Seek blocked.');
        return null;
      }

      return seekData;
    }
);

castContext.start(options);