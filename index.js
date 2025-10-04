const
  fs = require('fs'),
  path = require('path'),
  handlebars = require('handlebars'),
  handlebarsWax = require('handlebars-wax'),
  addressFormat = require('address-format'),
  moment = require('moment'),
  Swag = require('swag');

Swag.registerHelpers(handlebars);

handlebars.registerHelper({
  removeProtocol: function (url) {
    return url.replace(/.*?:\/\//g, '');
  },

  concat: function () {
    let res = '';

    for (let arg in arguments) {
      if (typeof arguments[arg] !== 'object') {
        res += arguments[arg];
      }
    }

    return res;
  },

  formatAddress: function (address, city, region, postalCode, countryCode) {
    let addressList = addressFormat({
      address: address,
      city: city,
      subdivision: region,
      postalCode: postalCode,
      countryCode: countryCode
    });


    return addressList.join('<br/>');
  },

  formatDate: function (date) {
    return moment(date).format('MM/YYYY');
  }
});

// Load simple locale JSON files from ./locales
let translations = {};
try {
  const localesDir = path.join(__dirname, 'locales');
  if (fs.existsSync(localesDir)) {
    fs.readdirSync(localesDir).forEach(file => {
      if (file.match(/\.json$/)) {
        const code = path.basename(file, '.json');
        try {
          translations[code] = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
        } catch (e) {
          // ignore malformed locale files
          translations[code] = {};
        }
      }
    });
  }
} catch (e) {
  translations = {};
}

// Helper: t - translate a dot.notation.key
handlebars.registerHelper('t', function (key, options) {
  // Prefer RESUME_LANG env var (set by npm scripts), then options.hash.lang, then root.lang
  const envLang = (process && process.env && process.env.RESUME_LANG) ? process.env.RESUME_LANG : undefined;
  const lang = envLang || (options && options.hash && options.hash.lang) || (options && options.data && options.data.root && options.data.root.lang) || 'en';
  const langTable = translations[lang] || translations['en'] || {};

  function lookup(obj, path) {
    if (!obj) return undefined;
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
  }

  let res = lookup(langTable, key);
  if (res === undefined) {
    // Fallback to english if different language missing
    res = lookup(translations['en'] || {}, key) || key;
  }

  return new handlebars.SafeString(res);
});


function render(resume) {
  let dir = __dirname + '/public',
    css = fs.readFileSync(dir + '/styles/main.css', 'utf-8'),
    resumeTemplate = fs.readFileSync(dir + '/views/resume.hbs', 'utf-8');

  let Handlebars = handlebarsWax(handlebars);

  Handlebars.partials(dir + '/views/partials/**/*.{hbs,js}');
  Handlebars.partials(dir + '/views/components/**/*.{hbs,js}');

  // Determine language: prefer RESUME_LANG env var (set by npm scripts), fallback to 'en'
  const lang = process.env.RESUME_LANG || 'en';

  return Handlebars.compile(resumeTemplate)({
    css: css,
    resume: resume,
    lang: lang
  });
}

module.exports = {
  render: render
};
