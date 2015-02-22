from twython import Twython, TwythonError
import ConfigParser, os
import time
import json

config = ConfigParser.ConfigParser()
config.read('config.cfg')
APP_KEY = config.get('Tweet', 'consumer_key')
APP_SECRET = config.get('Tweet', 'consumer_secret')
OAUTH_TOKEN = config.get('Tweet', 'access_key')
OAUTH_TOKEN_SECRET = config.get('Tweet', 'access_secret')
TIPDOGE_API_KEY =  config.get('Tweet', 'tipdoge_api_key')

#initialize all API objects
twitter = Twython(APP_KEY, APP_SECRET, OAUTH_TOKEN, OAUTH_TOKEN_SECRET)


keywords = [
  'COPD',
  'asthma',
  'injury',
  'earthquake',
  'flu',
  'measles',
  'cigarette',
  'diabetes',
  'vaccination',
  'stressful'
]

if os.path.exists('db.json'):
    DB = json.loads(open('db.json').read());
else:
    DB = {}

while True:
  for keyword in keywords:
    try:
        #search_results = twitter.search_geo(query='Canada')
        search_results = twitter.search(q='place:3376992a082d67c7 %s' % keyword, count=100)
    except TwythonError as e:
        print e
    print search_results    
    DB[keyword] = []
    for tweet in search_results['statuses']:

        tw = {
            'user': tweet['user']['screen_name'].encode('utf-8'),
            'when': tweet['created_at'],
            'text': tweet['text'].encode('utf-8'),
            'geo': tweet['geo'],
        }
        print tw

        DB[keyword].append(tw)
    open('db.json','w').write(json.dumps(DB))

    time.sleep(60)
  time.sleep(600)
