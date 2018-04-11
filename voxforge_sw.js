/*
Copyright 2018 VoxForge

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

importScripts('assets/static/scripts/processSavedSubmissions.js'); 
// TODO: processSavedSubmissions is called from service worker (voxforge_sw.js) 
// from a absolute root (as opposed to relative path) therefore localforage 
// import must be done in calling script
importScripts('assets/static/lib/localforage.js');

/**
this allows testing of service workers on private network:
https://stackoverflow.com/questions/43665243/invalid-self-signed-ssl-cert-subject-alternative-name-missing?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa

// F12; Network>Disable Cache
// F12 Application>Service Workers>Update on reload

// this does not work:
//In 'chrome://flags' set 'Allow invalid certificates from resources loaded from localhost'

chrome://serviceworker-internals  > open DEvTools window and pause Javascript
execution on Service Worker startup...
*/

var CACHE_NAME = 'voxforge-cache-v0.1';
var PATH = '/assets/static/';

var urlsToCache = [
  PATH + 'lib/EncoderWorker.js',
  PATH + 'lib/jquery-1.12.4.js',
  PATH + 'lib/jquery.mobile-1.4.5.js',
  PATH + 'lib/languages.js',
  PATH + 'lib/platform.js',
  PATH + 'lib/visualize.js',
  PATH + 'lib/wavesurfer.js',
  PATH + 'lib/idb-keyval.js',
  PATH + 'lib/jszip.js',
  PATH + 'lib/localforage.js',
  PATH + 'lib/state-machine.js',
  PATH + 'lib/WavAudioEncoder.js',

  PATH + 'scripts/app.js',
  PATH + 'scripts/Audio.js',
  PATH + 'scripts/processSavedSubmissions.js',
  PATH + 'scripts/Profile.js',
  PATH + 'scripts/Prompts.js',
  PATH + 'scripts/upload.js',
  PATH + 'scripts/View.js',
  PATH + 'scripts/UploadWorker.js',
  PATH + 'scripts/ZipWorker.js',


  PATH + 'styles/app.css',
  PATH + 'styles/jquery.mobile-1.4.5.css',

  '/en/read/',
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        sendMessage("message from service worker: install");
        return cache.addAll(urlsToCache);
      })
  );
});

/**
* If we want to cache new requests cumulatively, we can do so by handling the
* response of the fetch request and then adding it to the cache, like below.
*
* see: https://developers.google.com/web/fundamentals/primers/service-workers/

// TODO do we need a manifest file???
// http://diveintohtml5.info/offline.html

*/
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        sendMessage("message from service worker: fetch");
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

/**
*
* see: https://developers.google.com/web/updates/2015/12/background-sync
checkForSavedSubmissions() is promise indicating the success/failure of 
upload of submission to VoxForge server: 
If it fulfills, the sync is complete. 
If it fails, another sync will be scheduled to retry. 
Retry syncs also wait for connectivity, and employ an exponential back-off.
*/

// trying to send message from service woker back to caller,
// not as simple as it should be...
// https://stackoverflow.com/questions/30177782/chrome-serviceworker-postmessage?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
self.addEventListener('sync', function(event) {
  sendMessage("message from service worker: sync called");
  if (event.tag == 'voxforgeSync') {
     console.log('background sync request received by serviceworker');

    // waitUntil method is used to tell the browser not to terminate the 
    // service worker until the promise passed to waitUntil is either resolved 
    // or rejected.

//chrome://serviceworker-internals
    // https://googlechrome.github.io/samples/service-worker/post-message/index.html
    event.waitUntil(
      processSavedSubmissions()
      .then(function(response) {
        sendMessage("voxforgeSync**************************WTF");
        resolve('OK');
      })
      .catch(function(err) {
        reject('sendMessage err: ' + err);
      })
    ); 

  }
});


// https://miguelmota.com/blog/getting-started-with-service-workers/
//http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.Wsz7C-yEdNA
//https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage
//https://serviceworke.rs/message-relay_service-worker_doc.html
/**
* A page is controlled by a service worker on navigation to an origin that the 
* service worker is registered for. So the original page load that actually
* initializes the service worker is not itself controlled.
* That's why the worker only finds your tab once you visit with a new tab or 
*do a refresh.
*
* https://stackoverflow.com/questions/35100759/serviceworkers-focus-tab-clients-is-empty-on-notificationclick/35108844?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
*/
function sendMessage(message) {
  self.clients.matchAll({includeUncontrolled: true, type: 'window'})
  .then(function(clientList) {
    clientList.forEach(function(client) {
      client.postMessage({
        message: message
      });
    });
  });
}
