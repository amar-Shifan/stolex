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


app.use(nocache());

// Session Middleware
app.use(
    session({
        secret: env.SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Secure true if HTTPS
    })
);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.json())

connectDB();

app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.use(passport.initialize())
app.use(passport.session())

app.use(methodOverride('_method')) // to get put and patch

const userRoutes = require('./router/user.js')
const adminRoutes = require('./router/admin.js')

app.use('/',userRoutes)
app.use('/admin',adminRoutes)

// const adminRoute = require('./router/admin.js');
// app.use(adminRoute)


const PORT = env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
