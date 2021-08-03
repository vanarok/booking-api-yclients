const express = require('express');
const app = express()
const hash = require('md5');
const md5key = "W@KS4q6x%g?XR8"
const {default: PQueue} = require('p-queue');
const queue = new PQueue({intervalCap: 1, interval: 200});
const got = require('got');
const port = 3000
const basePath = '/api'
const companyId = '494680'
const authTokenUser = "7ab7473da117707ff4babe079e3dcb09"
const authTokenBearer = 'kdbsg2ujeseu99a3uk7e'
const authToken = 'Bearer ' + authTokenBearer + ', User ' + authTokenUser
const staffIdList = {
    "casinorobbery": ['1528160', '1528163'],
    "drfrankenstein": ['1528164', '1528166'],
    "areasofdarkness": ['1528170', '1528171'],
    "mousetrap": ['1528178', '1528179']
}
const option = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.yclients.v2+json',
        'Authorization': authToken
    }
}
const success = {
    "time": {"success": false, "message": "Указанное время занято"},
    "true": {"success": true},
    "hash": {"success": false, "message": "Неверный md5 хэш"},
    "invalid": {"success": false, "message": "Неверные параметры url"},
    "staff": {"success": false, "message": "Отсутствует свободный сотрудник на эту дату и время"},
    "post": {"success": false, "message": "Не удалось зарегистрировать бронирование"}
}
const apiIdList = {
    "questguild": 1
}
const dateFormat = /^\d{4}\-\d{2}\-\d{2}$/;
const timeFormat = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/;
const numbersFormat = /^\d+$/;
const decimalFormat = /^\s*-?[1-9]\d*(\.\d{1,2})?\s*$/;
const uppercaseFormat = /^[A-Z]+$/;
const lowercaseFormat = /^[a-z]+$/;
const stringFormat = /^[A-Za-z0-9]+$/;
const md5Format = /^[a-f0-9]{32}$/;
const fisrtNameFormat = /^\p{L}{2,14}$/u;
const familyNameFormat = /^\p{L}{2,14}$/u

function verifyParamUrl(staffId, api) {
    return staffIdList.hasOwnProperty(staffId) && apiIdList.hasOwnProperty(api)
}

async function getPrice(staffId, api, date, time) {
    const seance = await getSeances(staffId, api, date, 1)
    const filterSeance = seance.filter(e => e.date === date && e.time === time)
    const serviceStaffId = await getServiceYclients(filterSeance[0].staffId)
    const result = Object.assign({}, ...serviceStaffId.map(e => ({[e.title.split(" в ")[0] + " " + e.price_min + " руб:"]: e.price_min})))

    return seance.length !== 0 ? result : success.staff
}

async function postRecord(questID, api, {
    comment,
    date,
    email,
    family_name,
    first_name,
    phone,
    price,
    staffId,
    time,
    md5
}) {
    const md5hash = hash(first_name + family_name + phone + email + md5key)

    if (!md5Format.test(md5) && md5hash !== md5) return success.hash


    const services = await getServiceYclients(staffId)
    const filterPrice = services.filter(e => parseInt(e.price_min) === parseInt(price))

    let x = [];
    if (filterPrice.length > 0) {
        x = filterPrice[0];
    } else return success.post

    return (await postRecordYclients({
        "staff_id": staffId,
        "services": [
            {
                "id": x.id,
                "cost": price
            }
        ],
        "client": {
            "phone": phone,
            "name": family_name + ' ' + first_name,
            "email": email,
        },
        "send_sms": true,
        "sms_remain_hours": 1,
        "email_remain_hours": 12,
        "save_if_busy": false,
        "datetime": date + "T" + time + ":00+03:00",
        "seance_length": parseInt((x.staff)[0][0].seance_length),
        "comment": comment,
        "attendance": 0,
        "api_id": apiIdList[api]
    })).success ? success.true : success.time

}

/**
 * @param {[string, string]} staffId
 * @param {date} date
 * @param {string} api
 * @param {number} amount
 */
async function getSeances(staffId, api, date, amount) {
    let seances = []
    let workDays = await workDateSort(staffId, date, amount > 1 ? 30 : 0);
    let [dayCost, nightCost] = [(await getServiceYclients(staffId[0]))[0].price_min, (await getServiceYclients(staffId[1]))[0].price_min]
    let [durationSeanceDay, durationSeanceNight] = [(await getServiceYclients(staffId[0])).filter(e => parseInt(e.price_min) === parseInt(dayCost))[0].staff[0][0].seance_length,
        (await getServiceYclients(staffId[1])).filter(e => parseInt(e.price_min) === parseInt(nightCost))[0].staff[0][0].seance_length]

    for (let i = 0; i < amount; i++) {
        let seanceDay = await getSeanceYclients(staffId[0], workDays[i])
        let seanceNight = await getSeanceYclients(staffId[1], workDays[i])
        let seance = seanceDay.concat(seanceNight)

        if (seance.length === 0) continue

        let seanceStyledDay = await styleQg(seanceDay, workDays[i], durationSeanceDay, staffId[0], dayCost)
        let seanceStyledNight = await styleQg(seanceNight, workDays[i], durationSeanceNight, staffId[1], nightCost)
        let seanceStyled = seanceStyledDay.concat(seanceStyledNight)
        seances = seances.concat(seanceStyled)

    }
    return seances
}

async function workDateSort([daySeanceId, nightSeanceId], date, days) {
    let workDateDay = await getWorkDayYclients(daySeanceId, date, days)
    let workDayNight = await getWorkDayYclients(nightSeanceId, date, days)
    let workDay = workDateDay.concat(workDayNight)

    return workDay.filter((item, index) => (workDay.indexOf(item) === index)).sort()
}


async function styleQg(seance, date, durationSeance, staffId, standardPrice) {
    const dateNow = (new Date()).toISOString().split('T')[0]
    return date === dateNow || date < dateNow ? await expiredSeance(await filterMap(seance, date, durationSeance, staffId, standardPrice)) : await filterMap(seance, date, durationSeance, staffId, standardPrice)
}

async function filterMap(seance, date, durationSeance, staffId, standardPrice) {
    return seance
        .filter(e => durationSeance === 3600 ?
            e.time.split(':')[1] === "00" :
            e.time.split(":")[1].split("")[1] !== "5")
        .map(e => ({date: date, ...e, price: standardPrice, staffId: staffId}))
}

function expiredSeance(seance) {

    return seance.map(e =>
        new Date(e.date + "T" + e.time + ":00+03:00") < new Date() ? {
            ...e,
            is_free: false
        } : {...e})
}

function getWorkDayYclients(staffId, d, days) {
    d = new Date(d)
    let beginDate = d
        .toISOString()
        .split('T')[0]
    let endDate = new Date(d.setDate(d.getDate() + days))
        .toISOString()
        .split('T')[0]
    return queue.add(async () => {
        const response = await got('https://api.yclients.com/api/v1/schedule/' + companyId + '/' + staffId + '/' + beginDate + '/' + endDate, option).json()
        //console.log(response.data)
        return response.data
            .filter(date => date.is_working === 1)
            .map(e => (e.date))
    });
}

function getServiceYclients(staffId) {
    return queue.add(async () => {
        const response = await got('https://api.yclients.com/api/v1/company/' + companyId + '/services/?staff_id=' + staffId, option).json()

        return response.data.length === 0 ? [] : response.data
    });

}

function getSeanceYclients(questId, date) {
    return queue.add(async () => {
        const response = await got('https://api.yclients.com/api/v1/timetable/seances/' + companyId + '/' + questId + '/' + date, option).json()

        return response.data.length === 0 ? [] : response.data
    });
}


function postRecordYclients(json) {
    try {
        return queue.add(async () => {
            return got.post('https://api.yclients.com/api/v1/records/' + companyId, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.yclients.v2+json',
                    'Authorization': authToken
                },
                json: json,
                responseType: 'json',
            }).json();
        });
    } catch (err) {
        console.log(err)
        console.log(JSON.stringify(err.response.body))
        console.log(err.response.json)

        return success.post;
    }
}

app.use(express.json())

app.get(basePath + '/seances/:staffId', async ({params, query}, res, next) => {
    try {
        const validateUrl = await verifyParamUrl(params.staffId, query.api)
        const seances = await getSeances(staffIdList[params.staffId], query.api, dateFormat.test(query.date) ? query.date : new Date(), query.amount);

        res.status(200).json(validateUrl && numbersFormat.test(query.amount) ? seances : success.invalid)
    } catch (err) {
        res.status(422).json(success.invalid)
        next(err)
    }
})

app.post(basePath + '/record/:staffId', async ({body, params, query}, res, next) => {
    try {
        const validateUrl = await verifyParamUrl(params.staffId, query.api)
        const postResult = await postRecord(staffIdList[params.staffId], query.api, body)

        res.status(200).json(validateUrl ? postResult : success.invalid)
    } catch (err) {
        res.status(422).json(success.invalid)
        next(err)
    }
})

app.get(basePath + '/price/:staffId', async ({params, query}, res, next) => {
    try {
        const validateUrl = await verifyParamUrl(params.staffId, query.api) && dateFormat.test(query.date) && timeFormat.test(query.time)
        const prices = await getPrice(staffIdList[params.staffId], query.api, query.date, query.time)

        res.status(200).json(validateUrl ? prices : success.invalid)
    } catch (err) {
        res.status(422).json(success.invalid)
        next(err)
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

