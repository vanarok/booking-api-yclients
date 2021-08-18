import 'dotenv/config';
import {default as PQueue} from 'p-queue';

export const queue = new PQueue.default({intervalCap: 1, interval: 200});

export const port = process.env.PORT;
export const companyId = process.env.COMPANY_ID;
export const authTokenBearer = process.env.BEARER_TOKEN;
export const authTokenUser = process.env.USER_TOKEN;
export const success = {
  'yes': {'success': true},
  'time_busy': {'success': false, 'message': 'Выбранное время недоступно'},
  'hashWrong': {'success': false, 'message': 'Неверный md5 хэш'},
  'wrongReq': {'success': false, 'message': 'Неверные параметры запроса'},
  'noFreeStaff': {
    'success': false,
    'message': 'Отсутствует свободный сотрудник на эту дату и время',
  },
  'recordFail': {
    'success': false,
    'message': 'Не удалось зарегистрировать бронирование',
  },
  'recordFailTime': {
    'success': false,
    'message': 'Время бронирования вышло',
  }
};
export const arrStaffId = {
  'casinorobbery': ['1528160', '1528163'],
  'drfrankenstein': ['1528164', '1528166'],
  'areasofdarkness': ['1528170', '1528171'],
  'mousetrap': ['1528178', '1528179'],
};
export const apiIdList = {
  'questguild': 1,
  'topkvestov': 2,
  'mirkvestov': 3,
};
export let storeSeances = {}
export const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
export const timeFormat = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/;
export const numbersFormat = /^\d+$/;
