const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const CF_API_KEY = process.env.CF_API_KEY;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const SERVER_IP = process.env.SERVER_IP;

const CF_BASE_URL = 'https://api.cloudflare.com/client/v4';

function createZone(domain) {
  const websiteData = {
    name: domain,
    account: {
      id: CF_ACCOUNT_ID,
    },
  };

  return axios
    .post(`${CF_BASE_URL}/zones`, websiteData, {
      headers: { Authorization: `Bearer ${CF_API_KEY}` },
    })
    .then((response) => {
      let zoneId = '';
      if (response.status === 200) {
        zoneId = response.data.result.id;
        console.log('Successfully created zone.');
      } else {
        console.error(`Status code was ${response.status}`);
        console.error(response.data);
      }

      return {
        status_code: response.status,
        response: response.data,
        zone_id: zoneId,
      };
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

async function createDnsRecord(zone, domain, content = SERVER_IP, dtype = 
'A', proxied = true) {
  const recordData = {
    type: dtype,
    name: domain,
    content: content,
    ttl: 1,
    proxied: proxied,
  };

  try {
    const response = await 
axios.post(`${CF_BASE_URL}/zones/${zone}/dns_records`, recordData, {
      headers: { Authorization: `Bearer ${CF_API_KEY}` },
    });

    if (response.status === 200) {
      const zoneId = response.data.result.id;
      console.log(`Successfully created record on zone ${zoneId}`);
    } else {
      console.error(`Status code was ${response.status}`);
      console.error(response.data);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = { createZone, createDnsRecord };

