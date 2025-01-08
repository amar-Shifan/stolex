// app.js
const express = require('express');
const app = express();
const path = require('path');
const env = require('./utils/env_var.js')
const connectDB = require('./utils/db.js')
const session = require('express-session');
const nocache = require('nocache');
const passport = require('./service/googleAuth.js')
const methodOverride = require('method-override')
const globalVarsMiddleware = require('./middlewares/user-middleware.js');
const offerCleanupJob = require('./utils/offerCleanup.js');
const MongoStore = require('connect-mongo');

// Session Middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: 'mongodb://127.0.0.1:27017/stolexEcom',
  }),
  cookie: {
    httpOnly: true,
    secure: false, // Set to true if using HTTPS
    maxAge: 86400000, // 1 day
  },
}));

app.use(nocache());

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.json())

connectDB();

offerCleanupJob();

app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.use(passport.initialize())
app.use(passport.session())

app.use(methodOverride('_method')) // to get put and patch
app.use(globalVarsMiddleware.globalVarsMiddleware);

const userRoutes = require('./router/user.js')
const adminRoutes = require('./router/admin.js')

app.use('/',userRoutes)
app.use('/admin',adminRoutes)

// 404 Handler for Users
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/admin')) {
      return res.status(404).render('user/error', { title: 'Admin - Page Not Found' });
  }
  res.status(404).render('user/error', { title: 'Page Not Found' });
});

const PORT = env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
