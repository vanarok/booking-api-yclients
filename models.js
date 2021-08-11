import {authTokenBearer, authTokenUser, companyId} from './config.js';
import {request} from './requestLib.js';

const token = 'Bearer ' + authTokenBearer + ', User ' + authTokenUser;
const headersGet = {
  'Content-Type': 'application/json',
  'Accept': 'application/vnd.yclients.v2+json',
  'Authorization': token,
};
const headersPost = {
  'Content-Type': 'application/json',
  'Accept': 'application/vnd.yclients.v2+json',
  'Authorization': token,
};

async function getWorkDayYclients(staffId, d, days) {
  d = new Date(d);
  const beginDate = d.toISOString().split('T')[0];
  const endDate = new Date(d.setDate(d.getDate() + days)).toISOString().
      split('T')[0];

  const option = {
    url: `https://api.yclients.com/api/v1/schedule/${companyId}/${staffId}/${beginDate}/${endDate}`,
    headers: headersGet,
    method: 'GET',
    responseType: 'json',
  };
  try {
    return resYclients(await request(option));
  } catch (err) {
    return false;
  }
}

async function getServiceYclients(staffId) {
  const option = {
    url: `https://api.yclients.com/api/v1/company/${companyId}/services/?staff_id=${staffId}`,
    headers: headersGet,
    method: 'GET',
    responseType: 'json',
  };
  try {
    return resYclients(await request(option));
  } catch (err) {
    return false;
  }
}

async function getSeanceYclients(questId, date) {
  const option = {
    url: `https://api.yclients.com/api/v1/timetable/seances/${companyId}/${questId}/${date}`,
    headers: headersGet,
    method: 'GET',
    responseType: 'json',
  };
  try {
    return resYclients(await request(option));
  } catch (err) {
    return false;
  }
}

async function postRecordYclients(json) {
  const option = {
    url: `https://api.yclients.com/api/v1/records/${companyId}`,
    headers: headersPost,
    json: json,
    method: 'POST',
    responseType: 'json',
  };
  try {
    return resYclients(await request(option));
  } catch (err) {
    return false;
  }
}

function resYclients(response) {
  return response.body.data;
}

export {
  getWorkDayYclients,
  getServiceYclients,
  getSeanceYclients,
  postRecordYclients,
};
