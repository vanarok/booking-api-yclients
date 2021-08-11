import {queue} from './config.js';
import got from 'got';

async function request(option) {
  option = requestHooks(option);
  return await queue.add(async () => await got(option));
}

function requestHooks(option) {
  option.hooks =
      {
        beforeError: [
          error => {
            const {response} = error;
            if (response && response.body) {
              error.success = false;
              error.message = response.body.meta.message;
            }
            return error;
          },
        ],
      };
  return option;
}

export {
  request,
  requestHooks,
};