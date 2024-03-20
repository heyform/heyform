import dayjs from 'dayjs'

export const TIME_ZONE_OPTIONS: IOptionType[] = [
  { label: '(GMT-11:00) Niue', value: 'Pacific/Niue' },
  {
    label: '(GMT-11:00) Samoa',
    value: 'Pacific/Pago_Pago'
  },
  {
    label: '(GMT-10:00) Cook Islands',
    value: 'Pacific/Rarotonga'
  },
  {
    label: '(GMT-10:00) Hawaii-Aleutian',
    value: 'Pacific/Honolulu'
  },
  { label: '(GMT-10:00) Tahiti', value: 'Pacific/Tahiti' },
  {
    label: '(GMT-09:30) Marquesas',
    value: 'Pacific/Marquesas'
  },
  {
    label: '(GMT-09:00) Gambier',
    value: 'Pacific/Gambier'
  },
  {
    label: '(GMT-09:00) Hawaii-Aleutian (Adak)',
    value: 'America/Adak'
  },
  {
    label: '(GMT-08:00) Anchorage',
    value: 'America/Anchorage'
  },
  {
    label: '(GMT-08:00) Juneau',
    value: 'America/Juneau'
  },
  {
    label: '(GMT-08:00) Metlakatla',
    value: 'America/Metlakatla'
  },
  {
    label: '(GMT-08:00) Nome',
    value: 'America/Nome'
  },
  {
    label: '(GMT-08:00) Sitka',
    value: 'America/Sitka'
  },
  {
    label: '(GMT-08:00) Yakutat',
    value: 'America/Yakutat'
  },
  {
    label: '(GMT-08:00) Pitcairn',
    value: 'Pacific/Pitcairn'
  },
  {
    label: '(GMT-07:00) Mexican Pacific',
    value: 'America/Hermosillo'
  },
  {
    label: '(GMT-07:00) Dawson Creek',
    value: 'America/Dawson_Creek'
  },
  {
    label: '(GMT-07:00) Fort Nelson',
    value: 'America/Fort_Nelson'
  },
  {
    label: '(GMT-07:00) Phoenix',
    value: 'America/Phoenix'
  },
  {
    label: '(GMT-07:00) Los Angeles',
    value: 'America/Los_Angeles'
  },
  {
    label: '(GMT-07:00) Tijuana',
    value: 'America/Tijuana'
  },
  {
    label: '(GMT-07:00) Vancouver',
    value: 'America/Vancouver'
  },
  {
    label: '(GMT-07:00) Dawson',
    value: 'America/Dawson'
  },
  {
    label: '(GMT-07:00) Whitehorse',
    value: 'America/Whitehorse'
  },
  {
    label: '(GMT-06:00) Belize',
    value: 'America/Belize'
  },
  {
    label: '(GMT-06:00) Costa Rica',
    value: 'America/Costa_Rica'
  },
  {
    label: '(GMT-06:00) El Salvador',
    value: 'America/El_Salvador'
  },
  {
    label: '(GMT-06:00) Guatemala',
    value: 'America/Guatemala'
  },
  {
    label: '(GMT-06:00) Managua',
    value: 'America/Managua'
  },
  {
    label: '(GMT-06:00) Regina',
    value: 'America/Regina'
  },
  {
    label: '(GMT-06:00) Swift Current',
    value: 'America/Swift_Current'
  },
  {
    label: '(GMT-06:00) Tegucigalpa',
    value: 'America/Tegucigalpa'
  },
  { label: '(GMT-06:00) Easter Island', value: 'Pacific/Easter' },
  {
    label: '(GMT-06:00) Galapagos',
    value: 'Pacific/Galapagos'
  },
  {
    label: '(GMT-06:00) Chihuahua',
    value: 'America/Chihuahua'
  },
  {
    label: '(GMT-06:00) Mazatlan',
    value: 'America/Mazatlan'
  },
  {
    label: '(GMT-06:00) Boise',
    value: 'America/Boise'
  },
  {
    label: '(GMT-06:00) Cambridge Bay',
    value: 'America/Cambridge_Bay'
  },
  {
    label: '(GMT-06:00) Denver',
    value: 'America/Denver'
  },
  {
    label: '(GMT-06:00) Edmonton',
    value: 'America/Edmonton'
  },
  {
    label: '(GMT-06:00) Inuvik',
    value: 'America/Inuvik'
  },
  {
    label: '(GMT-06:00) Ojinaga',
    value: 'America/Ojinaga'
  },
  {
    label: '(GMT-06:00) Yellowknife',
    value: 'America/Yellowknife'
  },
  {
    label: '(GMT-05:00) Eirunepe',
    value: 'America/Eirunepe'
  },
  {
    label: '(GMT-05:00) Rio Branco',
    value: 'America/Rio_Branco'
  },
  {
    label: '(GMT-05:00) Bahia Banderas',
    value: 'America/Bahia_Banderas'
  },
  {
    label: '(GMT-05:00) Beulah, North Dakota',
    value: 'America/North_Dakota/Beulah'
  },
  {
    label: '(GMT-05:00) Center, North Dakota',
    value: 'America/North_Dakota/Center'
  },
  {
    label: '(GMT-05:00) Chicago',
    value: 'America/Chicago'
  },
  {
    label: '(GMT-05:00) Knox, Indiana',
    value: 'America/Indiana/Knox'
  },
  {
    label: '(GMT-05:00) Matamoros',
    value: 'America/Matamoros'
  },
  {
    label: '(GMT-05:00) Menominee',
    value: 'America/Menominee'
  },
  {
    label: '(GMT-05:00) Merida',
    value: 'America/Merida'
  },
  {
    label: '(GMT-05:00) Mexico City',
    value: 'America/Mexico_City'
  },
  {
    label: '(GMT-05:00) Monterrey',
    value: 'America/Monterrey'
  },
  {
    label: '(GMT-05:00) New Salem, North Dakota',
    value: 'America/North_Dakota/New_Salem'
  },
  {
    label: '(GMT-05:00) Rainy River',
    value: 'America/Rainy_River'
  },
  {
    label: '(GMT-05:00) Rankin Inlet',
    value: 'America/Rankin_Inlet'
  },
  {
    label: '(GMT-05:00) Resolute',
    value: 'America/Resolute'
  },
  {
    label: '(GMT-05:00) Tell City, Indiana',
    value: 'America/Indiana/Tell_City'
  },
  {
    label: '(GMT-05:00) Winnipeg',
    value: 'America/Winnipeg'
  },
  {
    label: '(GMT-05:00) Colombia',
    value: 'America/Bogota'
  },
  {
    label: '(GMT-05:00) Cancun',
    value: 'America/Cancun'
  },
  {
    label: '(GMT-05:00) Jamaica',
    value: 'America/Jamaica'
  },
  {
    label: '(GMT-05:00) Panama',
    value: 'America/Panama'
  },
  { label: '(GMT-05:00) Ecuador', value: 'America/Guayaquil' },
  {
    label: '(GMT-05:00) Peru',
    value: 'America/Lima'
  },
  {
    label: '(GMT-04:00) Boa Vista',
    value: 'America/Boa_Vista'
  },
  {
    label: '(GMT-04:00) Campo Grande',
    value: 'America/Campo_Grande'
  },
  {
    label: '(GMT-04:00) Cuiaba',
    value: 'America/Cuiaba'
  },
  {
    label: '(GMT-04:00) Manaus',
    value: 'America/Manaus'
  },
  {
    label: '(GMT-04:00) Porto Velho',
    value: 'America/Porto_Velho'
  },
  {
    label: '(GMT-04:00) Barbados',
    value: 'America/Barbados'
  },
  {
    label: '(GMT-04:00) Martinique',
    value: 'America/Martinique'
  },
  {
    label: '(GMT-04:00) Puerto Rico',
    value: 'America/Puerto_Rico'
  },
  {
    label: '(GMT-04:00) Santo Domingo',
    value: 'America/Santo_Domingo'
  },
  { label: '(GMT-04:00) Bolivia', value: 'America/La_Paz' },
  {
    label: '(GMT-04:00) Chile',
    value: 'America/Santiago'
  },
  { label: '(GMT-04:00) Cuba', value: 'America/Havana' },
  {
    label: '(GMT-04:00) Detroit',
    value: 'America/Detroit'
  },
  {
    label: '(GMT-04:00) Grand Turk',
    value: 'America/Grand_Turk'
  },
  {
    label: '(GMT-04:00) Indianapolis',
    value: 'America/Indiana/Indianapolis'
  },
  {
    label: '(GMT-04:00) Iqaluit',
    value: 'America/Iqaluit'
  },
  {
    label: '(GMT-04:00) Louisville',
    value: 'America/Kentucky/Louisville'
  },
  {
    label: '(GMT-04:00) Marengo, Indiana',
    value: 'America/Indiana/Marengo'
  },
  {
    label: '(GMT-04:00) Monticello, Kentucky',
    value: 'America/Kentucky/Monticello'
  },
  {
    label: '(GMT-04:00) New York',
    value: 'America/New_York'
  },
  {
    label: '(GMT-04:00) Nipigon',
    value: 'America/Nipigon'
  },
  {
    label: '(GMT-04:00) Pangnirtung',
    value: 'America/Pangnirtung'
  },
  {
    label: '(GMT-04:00) Petersburg, Indiana',
    value: 'America/Indiana/Petersburg'
  },
  {
    label: '(GMT-04:00) Port-au-Prince',
    value: 'America/Port-au-Prince'
  },
  {
    label: '(GMT-04:00) Thunder Bay',
    value: 'America/Thunder_Bay'
  },
  {
    label: '(GMT-04:00) Toronto',
    value: 'America/Toronto'
  },
  {
    label: '(GMT-04:00) Vevay, Indiana',
    value: 'America/Indiana/Vevay'
  },
  {
    label: '(GMT-04:00) Vincennes, Indiana',
    value: 'America/Indiana/Vincennes'
  },
  {
    label: '(GMT-04:00) Winamac, Indiana',
    value: 'America/Indiana/Winamac'
  },
  { label: '(GMT-04:00) Guyana', value: 'America/Guyana' },
  {
    label: '(GMT-04:00) Paraguay',
    value: 'America/Asuncion'
  },
  {
    label: '(GMT-04:00) Venezuela',
    value: 'America/Caracas'
  },
  {
    label: '(GMT-03:00) Buenos Aires',
    value: 'America/Argentina/Buenos_Aires'
  },
  {
    label: '(GMT-03:00) Catamarca',
    value: 'America/Argentina/Catamarca'
  },
  {
    label: '(GMT-03:00) Cordoba',
    value: 'America/Argentina/Cordoba'
  },
  {
    label: '(GMT-03:00) Jujuy',
    value: 'America/Argentina/Jujuy'
  },
  {
    label: '(GMT-03:00) La Rioja',
    value: 'America/Argentina/La_Rioja'
  },
  {
    label: '(GMT-03:00) Mendoza',
    value: 'America/Argentina/Mendoza'
  },
  {
    label: '(GMT-03:00) Rio Gallegos',
    value: 'America/Argentina/Rio_Gallegos'
  },
  {
    label: '(GMT-03:00) Salta',
    value: 'America/Argentina/Salta'
  },
  {
    label: '(GMT-03:00) San Juan',
    value: 'America/Argentina/San_Juan'
  },
  {
    label: '(GMT-03:00) San Luis',
    value: 'America/Argentina/San_Luis'
  },
  {
    label: '(GMT-03:00) Tucuman',
    value: 'America/Argentina/Tucuman'
  },
  {
    label: '(GMT-03:00) Ushuaia',
    value: 'America/Argentina/Ushuaia'
  },
  {
    label: '(GMT-03:00) Bermuda',
    value: 'Atlantic/Bermuda'
  },
  {
    label: '(GMT-03:00) Glace Bay',
    value: 'America/Glace_Bay'
  },
  {
    label: '(GMT-03:00) Goose Bay',
    value: 'America/Goose_Bay'
  },
  {
    label: '(GMT-03:00) Halifax',
    value: 'America/Halifax'
  },
  {
    label: '(GMT-03:00) Moncton',
    value: 'America/Moncton'
  },
  {
    label: '(GMT-03:00) Thule',
    value: 'America/Thule'
  },
  {
    label: '(GMT-03:00) Araguaina',
    value: 'America/Araguaina'
  },
  {
    label: '(GMT-03:00) Bahia',
    value: 'America/Bahia'
  },
  {
    label: '(GMT-03:00) Belem',
    value: 'America/Belem'
  },
  {
    label: '(GMT-03:00) Fortaleza',
    value: 'America/Fortaleza'
  },
  {
    label: '(GMT-03:00) Maceio',
    value: 'America/Maceio'
  },
  {
    label: '(GMT-03:00) Recife',
    value: 'America/Recife'
  },
  {
    label: '(GMT-03:00) Santarem',
    value: 'America/Santarem'
  },
  {
    label: '(GMT-03:00) Sao Paulo',
    value: 'America/Sao_Paulo'
  },
  {
    label: '(GMT-03:00) Falkland Islands',
    value: 'Atlantic/Stanley'
  },
  { label: '(GMT-03:00) French Guiana', value: 'America/Cayenne' },
  {
    label: '(GMT-03:00) Palmer',
    value: 'Antarctica/Palmer'
  },
  {
    label: '(GMT-03:00) Punta Arenas',
    value: 'America/Punta_Arenas'
  },
  { label: '(GMT-03:00) Rothera', value: 'Antarctica/Rothera' },
  {
    label: '(GMT-03:00) Suriname',
    value: 'America/Paramaribo'
  },
  {
    label: '(GMT-03:00) Uruguay',
    value: 'America/Montevideo'
  },
  {
    label: '(GMT-02:30) Newfoundland',
    value: 'America/St_Johns'
  },
  {
    label: '(GMT-02:00) Fernando de Noronha',
    value: 'America/Noronha'
  },
  {
    label: '(GMT-02:00) South Georgia',
    value: 'Atlantic/South_Georgia'
  },
  {
    label: '(GMT-02:00) St Pierre & Miquelon',
    value: 'America/Miquelon'
  },
  {
    label: '(GMT-02:00) West Greenland',
    value: 'America/Nuuk'
  },
  {
    label: '(GMT-01:00) Cape Verde',
    value: 'Atlantic/Cape_Verde'
  },
  {
    label: '(GMT+00:00) Azores',
    value: 'Atlantic/Azores'
  },
  {
    label: '(GMT+00:00) Coordinated Universal',
    value: 'UTC'
  },
  {
    label: '(GMT+00:00) East Greenland',
    value: 'America/Scoresbysund'
  },
  {
    label: '(GMT+00:00) Greenwich Mean',
    value: 'Etc/GMT'
  },
  {
    label: '(GMT+00:00) Abidjan',
    value: 'Africa/Abidjan'
  },
  {
    label: '(GMT+00:00) Bissau',
    value: 'Africa/Bissau'
  },
  {
    label: '(GMT+00:00) Danmarkshavn',
    value: 'America/Danmarkshavn'
  },
  {
    label: '(GMT+00:00) Monrovia',
    value: 'Africa/Monrovia'
  },
  {
    label: '(GMT+00:00) Reykjavik',
    value: 'Atlantic/Reykjavik'
  },
  {
    label: '(GMT+00:00) São Tomé',
    value: 'Africa/Sao_Tome'
  },
  {
    label: '(GMT+01:00) Algiers',
    value: 'Africa/Algiers'
  },
  {
    label: '(GMT+01:00) Tunis',
    value: 'Africa/Tunis'
  },
  { label: '(GMT+01:00) Ireland', value: 'Europe/Dublin' },
  {
    label: '(GMT+01:00) Morocco',
    value: 'Africa/Casablanca'
  },
  {
    label: '(GMT+01:00) United Kingdom',
    value: 'Europe/London'
  },
  {
    label: '(GMT+01:00) Lagos',
    value: 'Africa/Lagos'
  },
  {
    label: '(GMT+01:00) Ndjamena',
    value: 'Africa/Ndjamena'
  },
  {
    label: '(GMT+01:00) Canary',
    value: 'Atlantic/Canary'
  },
  {
    label: '(GMT+01:00) Faroe',
    value: 'Atlantic/Faroe'
  },
  {
    label: '(GMT+01:00) Lisbon',
    value: 'Europe/Lisbon'
  },
  {
    label: '(GMT+01:00) Madeira',
    value: 'Atlantic/Madeira'
  },
  {
    label: '(GMT+01:00) Western Sahara',
    value: 'Africa/El_Aaiun'
  },
  {
    label: '(GMT+02:00) Juba',
    value: 'Africa/Juba'
  },
  {
    label: '(GMT+02:00) Khartoum',
    value: 'Africa/Khartoum'
  },
  {
    label: '(GMT+02:00) Maputo',
    value: 'Africa/Maputo'
  },
  {
    label: '(GMT+02:00) Windhoek',
    value: 'Africa/Windhoek'
  },
  {
    label: '(GMT+02:00) Amsterdam',
    value: 'Europe/Amsterdam'
  },
  {
    label: '(GMT+02:00) Andorra',
    value: 'Europe/Andorra'
  },
  {
    label: '(GMT+02:00) Belgrade',
    value: 'Europe/Belgrade'
  },
  {
    label: '(GMT+02:00) Berlin',
    value: 'Europe/Berlin'
  },
  {
    label: '(GMT+02:00) Brussels',
    value: 'Europe/Brussels'
  },
  {
    label: '(GMT+02:00) Budapest',
    value: 'Europe/Budapest'
  },
  {
    label: '(GMT+02:00) Ceuta',
    value: 'Africa/Ceuta'
  },
  {
    label: '(GMT+02:00) Copenhagen',
    value: 'Europe/Copenhagen'
  },
  {
    label: '(GMT+02:00) Gibraltar',
    value: 'Europe/Gibraltar'
  },
  {
    label: '(GMT+02:00) Luxembourg',
    value: 'Europe/Luxembourg'
  },
  {
    label: '(GMT+02:00) Madrid',
    value: 'Europe/Madrid'
  },
  {
    label: '(GMT+02:00) Malta',
    value: 'Europe/Malta'
  },
  {
    label: '(GMT+02:00) Monaco',
    value: 'Europe/Monaco'
  },
  {
    label: '(GMT+02:00) Oslo',
    value: 'Europe/Oslo'
  },
  {
    label: '(GMT+02:00) Paris',
    value: 'Europe/Paris'
  },
  {
    label: '(GMT+02:00) Prague',
    value: 'Europe/Prague'
  },
  {
    label: '(GMT+02:00) Rome',
    value: 'Europe/Rome'
  },
  {
    label: '(GMT+02:00) Stockholm',
    value: 'Europe/Stockholm'
  },
  {
    label: '(GMT+02:00) Tirane',
    value: 'Europe/Tirane'
  },
  {
    label: '(GMT+02:00) Vienna',
    value: 'Europe/Vienna'
  },
  {
    label: '(GMT+02:00) Warsaw',
    value: 'Europe/Warsaw'
  },
  {
    label: '(GMT+02:00) Zurich',
    value: 'Europe/Zurich'
  },
  {
    label: '(GMT+02:00) Cairo',
    value: 'Africa/Cairo'
  },
  {
    label: '(GMT+02:00) Kaliningrad',
    value: 'Europe/Kaliningrad'
  },
  {
    label: '(GMT+02:00) Tripoli',
    value: 'Africa/Tripoli'
  },
  {
    label: '(GMT+02:00) South Africa',
    value: 'Africa/Johannesburg'
  },
  {
    label: '(GMT+02:00) Troll',
    value: 'Antarctica/Troll'
  },
  {
    label: '(GMT+03:00) Baghdad',
    value: 'Asia/Baghdad'
  },
  {
    label: '(GMT+03:00) Qatar',
    value: 'Asia/Qatar'
  },
  {
    label: '(GMT+03:00) Riyadh',
    value: 'Asia/Riyadh'
  },
  {
    label: '(GMT+03:00) East Africa',
    value: 'Africa/Nairobi'
  },
  {
    label: '(GMT+03:00) Amman',
    value: 'Asia/Amman'
  },
  {
    label: '(GMT+03:00) Athens',
    value: 'Europe/Athens'
  },
  {
    label: '(GMT+03:00) Beirut',
    value: 'Asia/Beirut'
  },
  {
    label: '(GMT+03:00) Bucharest',
    value: 'Europe/Bucharest'
  },
  {
    label: '(GMT+03:00) Chisinau',
    value: 'Europe/Chisinau'
  },
  {
    label: '(GMT+03:00) Damascus',
    value: 'Asia/Damascus'
  },
  {
    label: '(GMT+03:00) Gaza',
    value: 'Asia/Gaza'
  },
  {
    label: '(GMT+03:00) Hebron',
    value: 'Asia/Hebron'
  },
  {
    label: '(GMT+03:00) Helsinki',
    value: 'Europe/Helsinki'
  },
  {
    label: '(GMT+03:00) Kiev',
    value: 'Europe/Kiev'
  },
  {
    label: '(GMT+03:00) Nicosia',
    value: 'Asia/Nicosia'
  },
  {
    label: '(GMT+03:00) Riga',
    value: 'Europe/Riga'
  },
  {
    label: '(GMT+03:00) Sofia',
    value: 'Europe/Sofia'
  },
  {
    label: '(GMT+03:00) Tallinn',
    value: 'Europe/Tallinn'
  },
  {
    label: '(GMT+03:00) Uzhhorod',
    value: 'Europe/Uzhgorod'
  },
  {
    label: '(GMT+03:00) Vilnius',
    value: 'Europe/Vilnius'
  },
  {
    label: '(GMT+03:00) Zaporozhye',
    value: 'Europe/Zaporozhye'
  },
  { label: '(GMT+03:00) Famagusta', value: 'Asia/Famagusta' },
  {
    label: '(GMT+03:00) Israel',
    value: 'Asia/Jerusalem'
  },
  {
    label: '(GMT+03:00) Kirov',
    value: 'Europe/Kirov'
  },
  {
    label: '(GMT+03:00) Minsk',
    value: 'Europe/Minsk'
  },
  {
    label: '(GMT+03:00) Moscow',
    value: 'Europe/Moscow'
  },
  {
    label: '(GMT+03:00) Simferopol',
    value: 'Europe/Simferopol'
  },
  {
    label: '(GMT+03:00) Turkey',
    value: 'Europe/Istanbul'
  },
  {
    label: '(GMT+03:00) Volgograd',
    value: 'Europe/Volgograd'
  },
  { label: '(GMT+04:00) Armenia', value: 'Asia/Yerevan' },
  {
    label: '(GMT+04:00) Astrakhan',
    value: 'Europe/Astrakhan'
  },
  {
    label: '(GMT+04:00) Azerbaijan',
    value: 'Asia/Baku'
  },
  {
    label: '(GMT+04:00) Georgia',
    value: 'Asia/Tbilisi'
  },
  {
    label: '(GMT+04:00) Gulf',
    value: 'Asia/Dubai'
  },
  {
    label: '(GMT+04:00) Mauritius',
    value: 'Indian/Mauritius'
  },
  { label: '(GMT+04:00) Réunion', value: 'Indian/Reunion' },
  {
    label: '(GMT+04:00) Samara',
    value: 'Europe/Samara'
  },
  { label: '(GMT+04:00) Saratov', value: 'Europe/Saratov' },
  {
    label: '(GMT+04:00) Seychelles',
    value: 'Indian/Mahe'
  },
  { label: '(GMT+04:00) Ulyanovsk', value: 'Europe/Ulyanovsk' },
  {
    label: '(GMT+04:30) Afghanistan',
    value: 'Asia/Kabul'
  },
  {
    label: '(GMT+04:30) Iran',
    value: 'Asia/Tehran'
  },
  {
    label: '(GMT+05:00) French Southern & Antarctic',
    value: 'Indian/Kerguelen'
  },
  { label: '(GMT+05:00) Maldives', value: 'Indian/Maldives' },
  {
    label: '(GMT+05:00) Mawson',
    value: 'Antarctica/Mawson'
  },
  {
    label: '(GMT+05:00) Pakistan',
    value: 'Asia/Karachi'
  },
  {
    label: '(GMT+05:00) Tajikistan',
    value: 'Asia/Dushanbe'
  },
  {
    label: '(GMT+05:00) Turkmenistan',
    value: 'Asia/Ashgabat'
  },
  {
    label: '(GMT+05:00) Samarkand',
    value: 'Asia/Samarkand'
  },
  {
    label: '(GMT+05:00) Tashkent',
    value: 'Asia/Tashkent'
  },
  {
    label: '(GMT+05:00) Aktau',
    value: 'Asia/Aqtau'
  },
  {
    label: '(GMT+05:00) Aqtobe',
    value: 'Asia/Aqtobe'
  },
  {
    label: '(GMT+05:00) Atyrau',
    value: 'Asia/Atyrau'
  },
  {
    label: '(GMT+05:00) Oral',
    value: 'Asia/Oral'
  },
  {
    label: '(GMT+05:00) Qyzylorda',
    value: 'Asia/Qyzylorda'
  },
  {
    label: '(GMT+05:00) Yekaterinburg',
    value: 'Asia/Yekaterinburg'
  },
  {
    label: '(GMT+05:30) Colombo',
    value: 'Asia/Colombo'
  },
  {
    label: '(GMT+05:30) Kolkata',
    value: 'Asia/Kolkata'
  },
  {
    label: '(GMT+05:45) Nepal',
    value: 'Asia/Kathmandu'
  },
  { label: '(GMT+06:00) Bangladesh', value: 'Asia/Dhaka' },
  {
    label: '(GMT+06:00) Bhutan',
    value: 'Asia/Thimphu'
  },
  {
    label: '(GMT+06:00) Almaty',
    value: 'Asia/Almaty'
  },
  {
    label: '(GMT+06:00) Kostanay',
    value: 'Asia/Qostanay'
  },
  { label: '(GMT+06:00) Indian Ocean', value: 'Indian/Chagos' },
  {
    label: '(GMT+06:00) Kyrgyzstan',
    value: 'Asia/Bishkek'
  },
  { label: '(GMT+06:00) Omsk', value: 'Asia/Omsk' },
  {
    label: '(GMT+06:00) Urumqi',
    value: 'Asia/Urumqi'
  },
  { label: '(GMT+06:00) Vostok', value: 'Antarctica/Vostok' },
  {
    label: '(GMT+06:30) Cocos Islands',
    value: 'Indian/Cocos'
  },
  { label: '(GMT+06:30) Myanmar', value: 'Asia/Yangon' },
  {
    label: '(GMT+07:00) Barnaul',
    value: 'Asia/Barnaul'
  },
  { label: '(GMT+07:00) Christmas Island', value: 'Indian/Christmas' },
  {
    label: '(GMT+07:00) Davis',
    value: 'Antarctica/Davis'
  },
  {
    label: '(GMT+07:00) Hovd',
    value: 'Asia/Hovd'
  },
  {
    label: '(GMT+07:00) Bangkok',
    value: 'Asia/Bangkok'
  },
  {
    label: '(GMT+07:00) Ho Chi Minh City',
    value: 'Asia/Ho_Chi_Minh'
  },
  {
    label: '(GMT+07:00) Krasnoyarsk',
    value: 'Asia/Krasnoyarsk'
  },
  {
    label: '(GMT+07:00) Novokuznetsk',
    value: 'Asia/Novokuznetsk'
  },
  {
    label: '(GMT+07:00) Novosibirsk',
    value: 'Asia/Novosibirsk'
  },
  {
    label: '(GMT+07:00) Tomsk',
    value: 'Asia/Tomsk'
  },
  {
    label: '(GMT+07:00) Jakarta',
    value: 'Asia/Jakarta'
  },
  {
    label: '(GMT+07:00) Pontianak',
    value: 'Asia/Pontianak'
  },
  {
    label: '(GMT+08:00) Australian Western',
    value: 'Australia/Perth'
  },
  {
    label: '(GMT+08:00) Brunei Darussalam',
    value: 'Asia/Brunei'
  },
  {
    label: '(GMT+08:00) Central Indonesia',
    value: 'Asia/Makassar'
  },
  {
    label: '(GMT+08:00) Macao',
    value: 'Asia/Macau'
  },
  {
    label: '(GMT+08:00) Shanghai',
    value: 'Asia/Shanghai'
  },
  {
    label: '(GMT+08:00) Hong Kong',
    value: 'Asia/Hong_Kong'
  },
  {
    label: '(GMT+08:00) Irkutsk',
    value: 'Asia/Irkutsk'
  },
  {
    label: '(GMT+08:00) Kuala Lumpur',
    value: 'Asia/Kuala_Lumpur'
  },
  {
    label: '(GMT+08:00) Kuching',
    value: 'Asia/Kuching'
  },
  {
    label: '(GMT+08:00) Philippine',
    value: 'Asia/Manila'
  },
  {
    label: '(GMT+08:00) Singapore',
    value: 'Asia/Singapore'
  },
  {
    label: '(GMT+08:00) Taipei',
    value: 'Asia/Taipei'
  },
  {
    label: '(GMT+08:00) Choibalsan',
    value: 'Asia/Choibalsan'
  },
  {
    label: '(GMT+08:00) Ulaanbaatar',
    value: 'Asia/Ulaanbaatar'
  },
  {
    label: '(GMT+08:45) Australian Central Western',
    value: 'Australia/Eucla'
  },
  { label: '(GMT+09:00) East Timor', value: 'Asia/Dili' },
  {
    label: '(GMT+09:00) Eastern Indonesia',
    value: 'Asia/Jayapura'
  },
  {
    label: '(GMT+09:00) Japan',
    value: 'Asia/Tokyo'
  },
  {
    label: '(GMT+09:00) Pyongyang',
    value: 'Asia/Pyongyang'
  },
  {
    label: '(GMT+09:00) Seoul',
    value: 'Asia/Seoul'
  },
  {
    label: '(GMT+09:00) Palau',
    value: 'Pacific/Palau'
  },
  {
    label: '(GMT+09:00) Chita',
    value: 'Asia/Chita'
  },
  {
    label: '(GMT+09:00) Khandyga',
    value: 'Asia/Khandyga'
  },
  {
    label: '(GMT+09:00) Yakutsk',
    value: 'Asia/Yakutsk'
  },
  {
    label: '(GMT+09:30) Australian Central',
    value: 'Australia/Darwin'
  },
  {
    label: '(GMT+09:30) Adelaide',
    value: 'Australia/Adelaide'
  },
  {
    label: '(GMT+09:30) Broken Hill',
    value: 'Australia/Broken_Hill'
  },
  {
    label: '(GMT+10:00) Brisbane',
    value: 'Australia/Brisbane'
  },
  {
    label: '(GMT+10:00) Lindeman',
    value: 'Australia/Lindeman'
  },
  { label: '(GMT+10:00) Chamorro', value: 'Pacific/Guam' },
  {
    label: '(GMT+10:00) Chuuk',
    value: 'Pacific/Chuuk'
  },
  {
    label: '(GMT+10:00) Hobart',
    value: 'Australia/Hobart'
  },
  {
    label: '(GMT+10:00) Macquarie',
    value: 'Antarctica/Macquarie'
  },
  {
    label: '(GMT+10:00) Melbourne',
    value: 'Australia/Melbourne'
  },
  {
    label: '(GMT+10:00) Sydney',
    value: 'Australia/Sydney'
  },
  {
    label: '(GMT+10:00) Papua New Guinea',
    value: 'Pacific/Port_Moresby'
  },
  {
    label: '(GMT+10:00) Ust-Nera',
    value: 'Asia/Ust-Nera'
  },
  {
    label: '(GMT+10:00) Vladivostok',
    value: 'Asia/Vladivostok'
  },
  {
    label: '(GMT+10:30) Lord Howe',
    value: 'Australia/Lord_Howe'
  },
  { label: '(GMT+11:00) Bougainville', value: 'Pacific/Bougainville' },
  {
    label: '(GMT+11:00) Casey',
    value: 'Antarctica/Casey'
  },
  { label: '(GMT+11:00) Kosrae', value: 'Pacific/Kosrae' },
  {
    label: '(GMT+11:00) Magadan',
    value: 'Asia/Magadan'
  },
  {
    label: '(GMT+11:00) New Caledonia',
    value: 'Pacific/Noumea'
  },
  { label: '(GMT+11:00) Norfolk Island', value: 'Pacific/Norfolk' },
  {
    label: '(GMT+11:00) Ponape',
    value: 'Pacific/Pohnpei'
  },
  {
    label: '(GMT+11:00) Sakhalin',
    value: 'Asia/Sakhalin'
  },
  {
    label: '(GMT+11:00) Solomon Islands',
    value: 'Pacific/Guadalcanal'
  },
  {
    label: '(GMT+11:00) Srednekolymsk',
    value: 'Asia/Srednekolymsk'
  },
  {
    label: '(GMT+11:00) Vanuatu',
    value: 'Pacific/Efate'
  },
  {
    label: '(GMT+12:00) Anadyr',
    value: 'Asia/Anadyr'
  },
  {
    label: '(GMT+12:00) Fiji',
    value: 'Pacific/Fiji'
  },
  {
    label: '(GMT+12:00) Gilbert Islands',
    value: 'Pacific/Tarawa'
  },
  {
    label: '(GMT+12:00) Kwajalein',
    value: 'Pacific/Kwajalein'
  },
  {
    label: '(GMT+12:00) Majuro',
    value: 'Pacific/Majuro'
  },
  { label: '(GMT+12:00) Nauru', value: 'Pacific/Nauru' },
  {
    label: '(GMT+12:00) New Zealand',
    value: 'Pacific/Auckland'
  },
  {
    label: '(GMT+12:00) Petropavlovsk-Kamchatski',
    value: 'Asia/Kamchatka'
  },
  { label: '(GMT+12:00) Tuvalu', value: 'Pacific/Funafuti' },
  {
    label: '(GMT+12:00) Wake Island',
    value: 'Pacific/Wake'
  },
  { label: '(GMT+12:00) Wallis & Futuna', value: 'Pacific/Wallis' },
  {
    label: '(GMT+12:45) Chatham',
    value: 'Pacific/Chatham'
  },
  {
    label: '(GMT+13:00) Apia',
    value: 'Pacific/Apia'
  },
  { label: '(GMT+13:00) Phoenix Islands', value: 'Pacific/Kanton' },
  {
    label: '(GMT+13:00) Tokelau',
    value: 'Pacific/Fakaofo'
  },
  {
    label: '(GMT+13:00) Tonga',
    value: 'Pacific/Tongatapu'
  },
  { label: '(GMT+14:00) Line Islands', value: 'Pacific/Kiritimati' }
]

export const START_YEAR = dayjs().subtract(20, 'year').year()
export const YEAR_OPTIONS: IOptionType[] = Array.from({ length: 40 }, (_, i) => {
  const year = START_YEAR + i

  return {
    value: year,
    label: year
  }
})

export const MONTH_OPTIONS: IOptionType[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
].map((month, index) => ({
  value: index,
  label: month
}))
