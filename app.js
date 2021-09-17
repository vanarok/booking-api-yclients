import express from 'express';
import {port} from './config.js';
import router from './routes.js';
import {updateStoreSeances} from './services.js';

const app = express();

//расширение для разбора response post
app.use(express.urlencoded({extended: false}));
//Routes
app.use(router);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
updateStoreSeances()
setInterval(() => updateStoreSeances(), 900000);