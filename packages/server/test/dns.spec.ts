import { getDNSRecords } from '../src/utils/dns'

describe('DNS', () => {
  test('should return an array of records', async () => {
    const records = await getDNSRecords('tinaform.heyformapp.com')
    expect(records).toBeInstanceOf(Array)
  })
})
