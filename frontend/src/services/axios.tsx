import axios from 'axios';
import { serverURL } from './server';

export const withoutAuth = () => {
  return axios.create({
    baseURL: `${serverURL}`,
  });
};

export function userInstance(){
  let auth_val = "welcome";
  let auth_token = "welcome";

  return axios.create({
    baseURL: `${serverURL}`,
    headers: {
      Authorization: auth_val
        ? `${'Bearer '}${auth_val}`
        : '',
      authtoken: auth_token
        ? `${'Bearer '}${auth_token}`
        : '',
    },
    timeout: 1000 * 10,
  });
};

export async function notTimeOutUserInstance(){
    let auth_val = "welcome";
    let auth_token = "welcome";

    return axios.create({
    baseURL: serverURL,
    headers: {
      Authorization: auth_val
        ? `${'Bearer '}${auth_val}`
        : '',
      authtoken: auth_token
        ? `${'Bearer '}${auth_token}`
        : '',
    },
  });
};
