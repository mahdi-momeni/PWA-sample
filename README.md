# PWA-sample
great configs for all caching methods and push notification and work with hardware(camera,gps,vibration)

## What is PWA ?
Progressive Web Applications (PWA) are websites that provide a native app experience on a mobile phone.

### Features of an Ideal PWA:

#### Checklist by Google

1. **Starts Fast, Stays Fast :**
Optimised for user-centric performance metrics. Increases User Retention. Most of this comes from its fast responsiveness. Use Single Page Application (SPA) frameworks like React, Angular or Vue.
2. **Works in Any Browser :**
The website should still work properly on all kinds of browsers, across a spectrum of devices and browsers. Note that there are still users who are using low-end devices so you still have to cater to it. This is actually why the Progressive term was used in PWA, to imply that it is progressively usable for all users.
3. **Responsive to Any Screen Size :**
The layout of a website on a browser and mobile phone should be quite different. It should look more like an app when viewed on a mobile phone.
4. **Provides a Custom Offline Page :**
When there is no connection, it should not show the typical ‘No internet’ dinosaur page. Native apps would not show this right? You should have a friendly custom offline display within your ‘app’ that says there is no connection. This is achieved through the help of a Service Worker which I will explain under the technical components section below…
5. **Is Installable :**
Users are able to ‘install’ your PWA — afterwhich the PWA will have an App Icon on the home screen of their phones, just like any other native app. If they open this app, it is essentially a browser that opens in fullscreen without the browser tab, so it really looks like a native app, not an app on a browser (though it technically is). Achieved through the web app manifest explained below…
6. **Provides an Offline Experience :**
Where connectivity is not strictly required, the app works the same offline as it does online. In other words, some content could be cached when there is connection, and if there isn’t, it will still display as per normal (from cache), without having to load the whole browser again just like a typical website. The Service Worker helps with this.
7. **Is Fully Accessible :**
All websites (regardless of PWA) ought to optimise their websites for accessibility — pass WCAG2.0 accessibility requirements.
8. **Can be discovered through search :**
Ability for the PWA website to be discovered organically through search engines e.g. Google. SEO discoverable.
9. **Provides context for permission requests :**
If you do have to use APIs (like push notifications, geolocation, credentials), it is important to ask for permission with additional context explaining the use of it.
