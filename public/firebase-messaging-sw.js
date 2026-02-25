importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyA2Nd-IPdlKmTNyljYchzsxF7IWNIboJg8',
  authDomain: 'runner-79aeb.firebaseapp.com',
  projectId: 'runner-79aeb',
  storageBucket: 'runner-79aeb.firebasestorage.app',
  messagingSenderId: '699853687568',
  appId: '1:699853687568:web:bb745858f16709b6ad3395',
  measurementId: 'G-EDF96S5EDD',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Athletes Arena update'
  const body = payload.notification?.body || payload.data?.body || ''

  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
  })
})
