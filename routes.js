import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  arrStaffId,
  dateFormat,
  numbersFormat,
  success,
  timeFormat,
} from './config.js';
import {getPrice, getSeances, postRecord, validateUrl} from './services.js';

const router = express.Router();

router.get('/api/seances/:staffId',
    asyncHandler(async ({params, query: {api, date, amount}}, res) => {
      const trueUrl = await validateUrl(params.staffId, api) &&
          numbersFormat.test(amount);
      if (!trueUrl) return res.status(404).json(success.wrongReq);

      const result = await getSeances(arrStaffId[params.staffId], api,
          new Date(),
          amount);
      res.status(200).json(result);
    }));

router.get('/api/price/:staffId',
    asyncHandler(async ({
      params, query: {
        api,
        date,
        time,
      },
    }, res) => {
      const trueUrl = await validateUrl(params.staffId, api) &&
          dateFormat.test(date) && timeFormat.test(time);

      if (!trueUrl) return res.status(404).json(success.wrongReq);

      const result = await getPrice(arrStaffId[params.staffId], api, date,
          time);
      res.status(200).json(result);
    }));

router.post('/api/record/:staffId',
    asyncHandler(async ({body, params, query: {api}}, res) => {
      const trueUrl = await validateUrl(params.staffId, api);

      if (!trueUrl) return res.status(404).json(success.wrongReq);
      res.json(body)
      const result = await postRecord(arrStaffId[params.staffId], api, body);
      res.status(200).json(result);
    }));

export default router;