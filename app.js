import express from 'express';
import {port} from './config.js';
import router from './routes.js';

const app = express();

//расширение для разбора response post
app.use(express.json());
//Routes
app.use(router);

app.listen(port, () => {
  console.log('**Express Version: ');
  console.log(`Example app listening at http://localhost:${port}`);
});
