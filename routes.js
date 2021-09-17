import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  apiIdList,
  arrStaffId,
  dateFormat,
  numbersFormat,
  storeSeances,
  success,
  timeFormat,
} from './config.js';
import {getPrice, postRecord, validateUrl} from './services.js';

const router = express.Router();

router.get('/api/seances/:staffId',
    asyncHandler(
        async ({params: {staffId}, query: {api, date, amount}}, res) => {
          const trueUrl = await validateUrl(staffId, api) &&
              numbersFormat.test(amount);
          if (!trueUrl) return res.status(404).json(success.wrongReq);
          const result = storeSeances[api][staffId];
          res.status(200).json(result);
        }));

router.get('/api/price/:staffId',
    asyncHandler(async ({
                          params: {staffId}, query: {
        api,
        date,
        time,
      },
                        }, res) => {
      const trueUrl = await validateUrl(staffId, api) &&
          dateFormat.test(date) && timeFormat.test(time);

      if (!trueUrl) return res.status(404).json(success.wrongReq);

      const result = await getPrice(arrStaffId[staffId], api, date,
          time);
      res.status(200).json(result);
    }));

router.post('/api/record/:staffId',
    asyncHandler(async ({body, params, query: {api}}, res) => {
      const trueUrl = await validateUrl(params.staffId, api);
      if (!trueUrl) return res.status(404).json(success.wrongReq);
      const result = await postRecord(arrStaffId[params.staffId], api, body);
      let newStoreSeances = storeSeances;
      let index = await storeSeances[api][params.staffId].findIndex(
          e => e.date === body.date && e.time === body.time);
      let keysApiId = Object.keys(apiIdList);

      for (let i = 0; i < keysApiId.length; i++) {
        newStoreSeances[keysApiId[i]][params.staffId][index].is_free = false;
      }
      res.status(200).json(result);
    }));

export default router;