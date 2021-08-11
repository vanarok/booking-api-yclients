import {
  getSeanceYclients,
  getServiceYclients,
  getWorkDayYclients,
  postRecordYclients,
} from './models.js';
import {apiIdList, arrStaffId, success} from './config.js';

function validateUrl(staffId, api) {
  return arrStaffId.hasOwnProperty(staffId) && apiIdList.hasOwnProperty(api);
}

async function getPrice(staffId, api, date, time) {
  const seance = await getSeances(staffId, api, date, 1);
  const filterSeance = seance.filter(e => e.date === date && e.time === time);
  const serviceStaffId = await getServiceYclients(filterSeance[0].staffId);
  const result = Object.assign({},
      ...serviceStaffId.map(({price_min, title}) => ({
        [title.split(' в ')[0] + ':' + price_min + ' руб.']: price_min,
      })));

  return seance.length !== 0 ? result : success.noFreeStaff;
}

/**
 * @param {[string, string]} staffId
 * @param {date} date
 * @param {string} api
 * @param {number} amount
 */
async function getSeances(staffId, api, date, amount) {
  const workDays = await getWorkDay(staffId, date, amount > 1 ? 30 : 0);
  let seances = [];
  for (let i = 0; i < staffId.length; i++) {
    const service = await getServiceYclients(staffId[i]);
    const priceGroups = service.map(
        ({price_min, title}) => ({
          persons: parseInt(title.split(' ')[3]),
          price: price_min,
        }));
    const {price_min: price} = service[0];
    const durationSeance = service.filter(
        ({price_min}) => parseInt(price_min) ===
            parseInt(price))[0]['staff'][0][0].seance_length;

    for (let j = 0; j < amount; j++) {
      const seance = await getSeanceYclients(staffId[i], workDays[j]);
      if (seance.length === 0) continue;

      seances = seances.concat(
          await format(staffId[i], workDays[j], seance, price, durationSeance,
              priceGroups, api));
    }
  }
  //Сортировка по дате
  seances = seances.sort((a, b) => {
    let da = new Date(a.date),
        db = new Date(b.date);
    return da - db;
  });

  return seances;
}

async function postRecord(questID, api, body) {
  console.log(body)
  const {
    first_name,
    family_name,
    phone,
    email,
    comment,
    date,
    time,
    price,
    staffId,
  } = Object.assign({}, ...body.map(({key, value}) => ({[key]: value})));
  const services = await getServiceYclients(staffId);
  const filterPrice = services.filter(
      ({price_min}) => parseInt(price_min) === parseInt(price));

  if (filterPrice.length <= 0) return success.recordFail;

  const {id, staff} = filterPrice[0];

  return (await postRecordYclients({
    'staff_id': staffId,
    'services': [
      {
        'id': id,
        'cost': price,
      },
    ],
    'client': {
      'phone': phone,
      'name': family_name + ' ' + first_name,
      'email': email,
    },
    'send_sms': true,
    'sms_remain_hours': 1,
    'email_remain_hours': 12,
    'save_if_busy': false,
    'datetime': date + 'T' + time + ':00+03:00',
    'seance_length': parseInt((staff)[0][0].seance_length),
    'comment': comment,
    'attendance': 0,
    'api_id': apiIdList[api],
  })) ? success.yes : success.time_busy;

}

async function getWorkDay(staffId, date, days) {
  let workDays = [];
  for (let i = 0; i < staffId.length; i++) {
    const result = (await getWorkDayYclients(staffId[i], date, days)).filter(
        ({is_working}) => is_working === 1).
        map(e => (e.date));

    workDays = workDays.concat(result);
  }
  return workDays.filter((item, index) => (workDays.indexOf(item) === index)).
      sort();
}

async function format(
    staffId, date, seance, price, durationSeance, priceGroups, api) {
  const dateNow = (new Date()).toISOString().split('T')[0];

  seance = await filterMap(seance, date, durationSeance, staffId, price);

  if (date <= dateNow) {
    seance = seance.map(e => {
      if (new Date(e.date + 'T' + e.time + ':00+03:00') < new Date()) {
        return {...e, is_free: false};
      } else return {...e};
    });
  }

  if (api === 'topkvestov') {
    seance = seance.map(e => ({...e, price_groups: priceGroups}));
  }
  return seance;
}

async function filterMap(seance, date, durationSeance, staffId, price) {
  return seance.filter(e =>
      durationSeance === 3600 ?
          e.time.split(':')[1] === '00' :
          e.time.split(':')[1].split('')[1] !== '5').
      map(e => ({date: date, ...e, price: price, staffId: staffId}));
}

export {
  validateUrl,
  getPrice,
  getSeances,
  postRecord,
};