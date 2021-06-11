// const https = require('https')
// const fs = require('fs')
const axios = require('axios')
const tunnel = require('tunnel')
const cheerio = require('cheerio')
const HtmlTableToJson = require('html-table-to-json')
// const tabletojson = require('tabletojson').Tabletojson
const dotenv = require("dotenv");

dotenv.config()

const myAxiosInstance = axios.create();

const proxy11Url = `https://proxy11.com/api/proxy.json?key=${process.env.PROXY11_API_KEY}`;

const proxyUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=`;

const freeProxyListUrl = `${ process.env.PROXYLIST_URL }` //'https://free-proxy-list.net/';

const freeProxyListDotNet = async () => {
  try {
    
    const response = await myAxiosInstance.get(`${ freeProxyListUrl } `);
    const $ = cheerio.load(response.data);
    const $rawText = $('#raw .modal-body textarea.form-control').text().slice(73).split(/\r?\n/).filter(vl => vl !== '');
    const randomIp =
      $rawText[Math.floor(Math.random() * $rawText.length + 1)].split(':');
    console.log({ ip: randomIp[0], port: randomIp[1] });
    return { ip: randomIp[0], port: randomIp[1] };
  }
  catch (err) {
    console.log(err);
  }
}

const proxyListDotNetTable = async () => {
  try {
    const response = await myAxiosInstance.get(`${ freeProxyListUrl } `);
    const $ = cheerio.load(response.data);
    const $table = $('#proxylisttable').parent().html();
    const tableJson = HtmlTableToJson.parse($table).results[0].filter(vl => vl['5'] === 'elite proxy' && vl['3'] === 'US');
    // console.log(tableJson);
    // fs.writeFile('./texttable.json', JSON.stringify(tableJson), {}, () => {
    //   console.log("table saved");
    // })  
    const randomIp = tableJson[Math.floor(Math.random() * tableJson.length + 1)];
    // console.log("ri: ", randomIp);  
    console.log("randomIp: ", {ip: randomIp['1'], port: randomIp['2']});
    return { ip: randomIp['1'], port: randomIp['2'] };
  }
  catch (err) {
    console.log(err);
  }
}

const getProxyRotatorIp = async (countryCode = 'us') => {
  try {
    const ipData = await axios.get(proxy11Url);
    const responseData = ipData.data.data;
    const filteredData = responseData.filter(
      ip => ip.country_code === countryCode
    );
    const resultData = filteredData.length === 0 ? responseData : filteredData;
    // const highest = resultData.filter(ip => ip.time === Math.max.apply(Math,resultData.map(el => el.time)))[0];
    // const lowest = resultData.filter(ip => ip.time === Math.min.apply(Math, resultData.map(el => el.time)))[0];
    const randomIp =
      resultData[Math.floor(Math.random() * resultData.length + 1)];
    return randomIp
  } catch (err) {
    console.error(err);
  }
};

const getAgent = async () => {
  try {
    // const { ip, port } = await getProxyRotatorIp('us');
    const { ip, port } = await freeProxyListDotNet();

    const agent = tunnel.httpsOverHttp({
      proxy: {
        host: ip,
        port: port
      }
    });
    return agent;
  } catch (err) {
    console.error(err);
  }
};

const getData = async () => {
  try {
    // const listItem = '.results-list [data-stid="property-listing"]';
    const requestURL = `${process.env.EXP_BASE_URL}?cache_buster=${ Date.now()}`; //https://www.expedia.com/Hotel-Search
    const listItem = `${process.env.EXP_LIST_ITEM}`;//'.results-list [data-stid="property-listing"]'
    const name = `${process.env.EXP_NAME}`;//'[data-stid="content-hotel-title"]';
    const price = `${process.env.EXP_PRICE}`;// '[data-stid="content-hotel-price"] [data-stid="price-lockup-text"]'
    const rating = `${process.env.EXP_RATING}`;// '[data-stid="content-hotel-reviews-rating"]'

    // const httpsAgent = new https.Agent({ keepAlive: true });

    const queryStringObject = {
      rooms: '1',
      adults: '2',
      destination: 'Atlanta',
      regionId: '178232',
      latLong: '19.107168,72.891596',
      startDate: '2021-06-16',
      endDate: '2021-06-17',
      d1: '2021-06-16',
      d2: '2021-06-17'
    };

    const agent = await getAgent();

    const axiosConfig = {
      agent,
      responseType: 'document',
      params: queryStringObject
    };

    const response = await myAxiosInstance.get(`${requestURL}`, axiosConfig);

    const $ = cheerio.load(response.data);
    const $items = $(`${listItem}`);
    let responseJson = [];

    $items.map((index, el) => {
      const $name = $(el)
        .find(`${ name } `)
        .text();
      const $price = $(el)
        .find(`${ price } `)
        .text();
      const $rating = $(el)
        .find(`${ rating } `)
        .text();
      responseJson.push({
        name: $name,
        price: $price,
        rating: $rating
      });
    });

    console.log(responseJson);
    return responseJson;
  } catch (err) {
    console.error(err);
  }
};

getData();
// getProxyRotatorIp('us')
//freeProxyListDotNet()
// proxyListDotNetTable();
