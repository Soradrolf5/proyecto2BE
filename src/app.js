import express from 'express'
import session from 'express-session'
import storage from 'session-file-store'
import productsRouter from './routes/products.router.js'
import cartsRouter from './routes/carts.router.js'
import viewsRouter from './routes/views.router.js'
import messageRouter from './routes/messages.router.js';
import sessionsRouter from './routes/sessions.router.js'
import handlebars from 'express-handlebars'
import __dirname from "./utils.js"
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import passport from 'passport'
import initializePassport from './config/passport.js'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3030;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})

app.use(express.json());
app.use(express.urlencoded({extended:true}));

mongoose.connect('mongodb+srv://Soradrolf5:FlorenciaDaros5@cluster0.somhlid.mongodb.net/')
  .then(() => {
    console.log('Connected to database!');
  })
  .catch(error => {
    console.log(`Cannot connect to database: ${error}`);
    process.exit();
  });

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
      ttl: 20,
      autoRemove: 'interval',
      autoRemoveInterval: 60 // Eliminar sesiones expiradas cada 1 minuto
    })
  }));
  
  app.use(cookieParser());
 
  initializePassport();

app.use(passport.initialize());
app.use(passport.session({
  secret: process.env.SESSION_SECRET
}));


app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter)
app.use('/api/messages', messageRouter);
app.use('/api/session', sessionsRouter)
//estructura handlebars
app.engine('handlebars', handlebars.engine());
app.set("views", __dirname+"/views");
app.set("view engine", 'handlebars');

//archivos estaticos
app.use(express.static(__dirname + "/public"));









