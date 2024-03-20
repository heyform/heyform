import countries from './countries'

const countryMaps: Record<string, string> = {}

countries.forEach(country => {
  countryMaps[country.isoCode.toLowerCase()] = country.countryName
})

export default countryMaps
